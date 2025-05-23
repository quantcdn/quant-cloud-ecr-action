import * as core from '@actions/core';
import {
    ApplicationsApi
} from 'quant-ts-client';

const apiOpts = (apiKey: string) => {
    return{
        applyToRequest: (requestOptions: any) => {
            if (requestOptions && requestOptions.headers) {
                requestOptions.headers["Authorization"] = `Bearer ${apiKey}`;
            }
        }
    }
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
        core.warning(`Using base URL: ${baseUrl}`);
    }

    const client = new ApplicationsApi(baseUrl);
    client.setDefaultAuthentication(apiOpts(apiKey));

    core.info(`Getting ECR login credentials for ${organization} from ${baseUrl}`);

    try {
        const ecrToken = await client.getEcrLoginCredentials(organization);

        if (!ecrToken.body) {
            core.setFailed('No ECR token found');
            return;
        }

        if (!ecrToken.body.password) {
            core.setFailed('No ECR password found');
            return;
        }

        core.setOutput('username', ecrToken.body.username);
        core.setOutput('password', ecrToken.body.password);
        core.setOutput('endpoint', ecrToken.body.endpoint);
        core.setSecret(ecrToken.body.password);
    } catch (error) {
        core.error('Please check your API key and organization name');
        if (error instanceof Error) {
            core.setFailed(error.message);
        } else {
            core.setFailed('An unknown error occurred');
        }
    }
}

run();