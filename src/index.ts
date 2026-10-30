import * as core from '@actions/core';
import {
    ApplicationsApi,
    Configuration
} from '@quantcdn/quant-client';

interface ApiError {
    response?: { data?: { message?: string } };
}

/**
 * The main function for the action.
 * @returns {Promise<void>}
 */
async function run() {
    const apiKey = core.getInput('api_key', { required: true });
    const organization = core.getInput('organization', { required: true });
    let baseUrl = core.getInput('base_url', { required: false });

    if (!baseUrl) {
        baseUrl = 'https://dashboard.quantcdn.io/api/v3';
    } else {
        core.warning(`Using non-default base URL: ${baseUrl}`);
    }

    core.setSecret(apiKey);
    const client = new ApplicationsApi(new Configuration({ basePath: baseUrl.replace(/\/+$/, '').replace(/\/api\/v3$/, ''), accessToken: apiKey }));

    core.info(`Getting ECR login credentials for ${organization} from ${baseUrl}`);

    try {
        const ecrToken = await client.getEcrLoginCredentials(organization);

        if (!ecrToken.data) {
            core.setFailed('No ECR token found');
            return;
        }

        if (!ecrToken.data.password) {
            core.setFailed('No ECR password found');
            return;
        }

        core.info('✅ ECR login credentials retrieved successfully');

        core.setSecret(ecrToken.data.password);
        await core.setOutput('username', ecrToken.data.username);
        await core.setOutput('password', ecrToken.data.password);
        await core.setOutput('endpoint', ecrToken.data.endpoint);
    } catch (error) {
        core.error('Please check your API key and organization name');
        if (error instanceof Error) {
            const apiError = error as Error & ApiError;
            if (apiError.response?.data?.message) {
                if (apiError.response?.data.message == 'Unable to find matching result') {
                    core.setFailed('Either the organization does not exist or you do not have access to it');
                } else {
                    core.setFailed(apiError.response?.data.message);
                }
            } else {
                core.setFailed(error.message);
            }
        } else {
            core.setFailed('An unknown error occurred');
        }
    }
}

run();