# Quant Cloud ECR Login Action

This GitHub Action retrieves ECR login credentials from Quant Cloud and sets them up for Docker authentication.

## Usage

```yaml
- name: Get ECR Credentials
  uses: quantcdn/quant-cloud-ecr-action@v1
  id: ecr-login
  with:
    api_key: ${{ secrets.QUANT_API_KEY }}
    organization: your-org-name
    base_url: https://api.quant.cloud  # Optional

- name: Login to ECR
  uses: docker/login-action@v3
  with:
    registry: ${{ steps.ecr-login.outputs.endpoint }}
    username: ${{ steps.ecr-login.outputs.username }}
    password: ${{ steps.ecr-login.outputs.password }}
```

## Inputs

- `api_key`: Your Quant Cloud API key (required)
- `organization`: Your Quant Cloud organisation name (required)
- `base_url`: Quant Cloud API base URL (optional)

## Outputs

- `username`: ECR username
- `password`: ECR password (automatically masked in logs)
- `endpoint`: ECR registry endpoint

## Development

### Local Testing

1. Install dependencies:
```bash
npm install
```

2. Build the action:
```bash
npx ncc build src/index.ts
```

3. Run tests locally using act:
```bash
act workflow_dispatch -W .github/workflows/test.yml --secret-file .secrets
```

### Release Process

1. Update version in `package.json`
2. Create and push a new tag:
```bash
git tag v1.0.0
git push origin v1.0.0
```

The release workflow will automatically:
- Build the action
- Create a GitHub release
- Package the action for the marketplace 