# Quant Cloud ECR Login Action

This GitHub Action retrieves ECR login credentials from Quant Cloud and sets them up for Docker authentication.

## Usage

```yaml
- name: Get ECR Credentials
  uses: quant-cloud/quant-cloud-ecr-action@v1
  id: ecr-login
  with:
    api_key: ${{ secrets.QUANT_API_KEY }}
    organization: your-org-name
    base_url: https://api.quant.cloud  # Optional

- name: Login to ECR
  uses: docker/login-action@v3
  with:
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