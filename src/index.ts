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
    const baseUrl = core.getInput('base_url', { required: false });

    const client = new ApplicationsApi(baseUrl);
    client.setDefaultAuthentication(apiOpts(apiKey));

    try {
        const ecrToken = await client.getEcrLoginCredentials(organization);

        if (!ecrToken.body) {
            throw new Error('No ECR token found');
        }

        if (!ecrToken.body.password) {
            throw new Error('No ECR password found');
        }

        core.setOutput('username', ecrToken.body.username);
        core.setOutput('password', ecrToken.body.password);
        core.setOutput('endpoint', ecrToken.body.endpoint);
        core.setSecret(ecrToken.body.password);
    } catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        } else {
            core.setFailed('An unknown error occurred');
        }
    }
}

run();