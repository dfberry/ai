#!/bin/bash

# Get current user alias
USER_ALIAS=$(whoami)

# Generate a 6-character random string
RANDOM_STRING=$(cat /dev/urandom | tr -dc 'a-z0-9' | fold -w 6 | head -n 1)

# Variables - Replace these with your values
RESOURCE_GROUP="rg-openai-oneshot-${USER_ALIAS}-${RANDOM_STRING}"
LOCATION="eastus"
AZURE_OPENAI_RESOURCE_NAME="oneshot-${USER_ALIAS}-${RANDOM_STRING}"

CHAT_DEPLOYMENT_NAME="gpt-4o"
CHAT_MODEL_NAME="gpt-4o"
CHAT_MODEL_VERSION="2024-11-20"

EMBEDDING_DEPLOYMENT_NAME="text-embedding-ada-002"
EMBEDDING_MODEL_NAME="text-embedding-ada-002"
EMBEDDING_MODEL_VERSION="2"

# Use default subscription (no need to set explicitly)
echo "Creating Azure OpenAI resources with names:"
echo "Resource Group: $RESOURCE_GROUP"
echo "OpenAI Resource: $AZURE_OPENAI_RESOURCE_NAME"
echo "Chat Deployment: $CHAT_DEPLOYMENT_NAME"
echo "Embedding Deployment: $EMBEDDING_DEPLOYMENT_NAME"
echo ""

# Create resource group
echo "Creating resource group..."
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

if [ $? -ne 0 ]; then
  echo "Failed to create resource group"
  exit 1
fi

# Create Azure OpenAI resource
echo "Creating Azure OpenAI resource..."
az cognitiveservices account create \
  --name $AZURE_OPENAI_RESOURCE_NAME \
  --resource-group $RESOURCE_GROUP \
  --kind OpenAI \
  --sku S0 \
  --location $LOCATION \
  --yes

if [ $? -ne 0 ]; then
  echo "Failed to create Azure OpenAI resource"
  exit 1
fi

# Get current user's object ID for RBAC assignments
echo "Getting current user information for RBAC..."
USER_OBJECT_ID=$(az ad signed-in-user show --query id --output tsv)

if [ $? -ne 0 ] || [ -z "$USER_OBJECT_ID" ]; then
  echo "Failed to get current user object ID"
  exit 1
fi

echo "Current user object ID: $USER_OBJECT_ID"

# Assign Cognitive Services OpenAI Contributor role
echo "Assigning Cognitive Services OpenAI Contributor role..."
az role assignment create \
  --assignee $USER_OBJECT_ID \
  --role "a001fd3d-188f-4b5d-821b-7da978bf7442" \
  --scope "/subscriptions/$(az account show --query id --output tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.CognitiveServices/accounts/$AZURE_OPENAI_RESOURCE_NAME"

if [ $? -ne 0 ]; then
  echo "Failed to assign Cognitive Services OpenAI Contributor role"
  exit 1
fi

# Assign Cognitive Services OpenAI User role
echo "Assigning Cognitive Services OpenAI User role..."
az role assignment create \
  --assignee $USER_OBJECT_ID \
  --role "5e0bd9bd-7b93-4f28-af87-19fc36ad61bd" \
  --scope "/subscriptions/$(az account show --query id --output tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.CognitiveServices/accounts/$AZURE_OPENAI_RESOURCE_NAME"

if [ $? -ne 0 ]; then
  echo "Failed to assign Cognitive Services OpenAI User role"
  exit 1
fi

echo "RBAC roles assigned successfully!"

# Deploy the GPT-4 model
echo "Deploying GPT-4 model..."
az cognitiveservices account deployment create \
  --resource-group $RESOURCE_GROUP \
  --name $AZURE_OPENAI_RESOURCE_NAME \
  --deployment-name $CHAT_DEPLOYMENT_NAME \
  --model-name $CHAT_MODEL_NAME \
  --model-version $CHAT_MODEL_VERSION \
  --model-format OpenAI \
  --sku-capacity 10 \
  --sku-name Standard

if [ $? -ne 0 ]; then
  echo "Failed to deploy GPT-4 model"
  exit 1
fi

# Deploy the text embedding model
echo "Deploying text-embedding-ada-002 model..."
az cognitiveservices account deployment create \
  --resource-group $RESOURCE_GROUP \
  --name $AZURE_OPENAI_RESOURCE_NAME \
  --deployment-name $EMBEDDING_DEPLOYMENT_NAME \
  --model-name $EMBEDDING_MODEL_NAME \
  --model-version $EMBEDDING_MODEL_VERSION \
  --model-format OpenAI \
  --sku-capacity 10 \
  --sku-name Standard

if [ $? -ne 0 ]; then
  echo "Failed to deploy text embedding model"
  exit 1
fi

echo "Deployment completed successfully!"

# Output resource details
echo "Getting resource details..."
az cognitiveservices account show \
  --name $AZURE_OPENAI_RESOURCE_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "{name:name,location:location,endpoint:properties.endpoint,provisioningState:properties.provisioningState}" \
  --output table

echo ""
echo "Resource created successfully with the following details:"
echo "Resource Group: $RESOURCE_GROUP"
echo "OpenAI Resource: $AZURE_OPENAI_RESOURCE_NAME"
echo "Location: $LOCATION"
echo "Chat Deployment: $CHAT_DEPLOYMENT_NAME"
echo "Embedding Deployment: $EMBEDDING_DEPLOYMENT_NAME"

# Get and display the API key
echo ""
echo "Getting API key..."
API_KEY=$(az cognitiveservices account keys list \
  --name $AZURE_OPENAI_RESOURCE_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "key1" \
  --output tsv)

if [ $? -eq 0 ] && [ -n "$API_KEY" ]; then
  echo "API Key: $API_KEY"
else
  echo "Failed to retrieve API key"
fi

# Get and display the endpoint
ENDPOINT=$(az cognitiveservices account show \
  --name $AZURE_OPENAI_RESOURCE_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "properties.endpoint" \
  --output tsv)

if [ $? -eq 0 ] && [ -n "$ENDPOINT" ]; then
  echo "Endpoint: $ENDPOINT"
else
  echo "Failed to retrieve endpoint"
fi

echo ""
echo "=================================================="
echo "Environment Variables for .env file:"
echo "=================================================="
echo "# Copy these values to your .env file"
echo ""
echo "# Azure OpenAI Configuration"
echo "AZURE_OPENAI_RESOURCE_NAME=$AZURE_OPENAI_RESOURCE_NAME"
echo "AZURE_OPENAI_DEPLOYMENT_NAME=$CHAT_DEPLOYMENT_NAME"
echo "AZURE_OPENAI_API_VERSION=2024-02-01"
echo "AZURE_OPENAI_MODEL_NAME=$CHAT_MODEL_NAME"
if [ -n "$ENDPOINT" ]; then
  echo "AZURE_OPENAI_ENDPOINT=$ENDPOINT"
fi
if [ -n "$API_KEY" ]; then
  echo "AZURE_OPENAI_API_KEY=$API_KEY"
fi
echo ""
echo "# Embedding Model Configuration"
echo "AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME=$EMBEDDING_DEPLOYMENT_NAME"
echo "AZURE_OPENAI_EMBEDDING_MODEL_NAME=$EMBEDDING_MODEL_NAME"
echo ""
echo "# Optional: OpenAI API Key (if using OpenAI directly)"
echo "# OPENAI_API_KEY=your_openai_api_key_here"
echo ""
echo "=================================================="