#!/bin/bash
# Azure CLI script to create a Speech resource and output the key and region
# Usage: ./create-azure-speech-resource.sh <resource-group> <resource-name> <location>

set -e

RESOURCE_GROUP="$1"
RESOURCE_NAME="$2"
LOCATION="$3"

if [ -z "$RESOURCE_GROUP" ] || [ -z "$RESOURCE_NAME" ] || [ -z "$LOCATION" ]; then
  echo "Usage: $0 <resource-group> <resource-name> <location>"
  exit 1
fi

# Create resource group if it doesn't exist
az group create --name "$RESOURCE_GROUP" --location "$LOCATION"

# Create the Speech resource
az cognitiveservices account create \
  --name "$RESOURCE_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --kind SpeechServices \
  --sku S0 \
  --location "$LOCATION" \
  --yes

# Get the key and region
KEY=$(az cognitiveservices account keys list --name "$RESOURCE_NAME" --resource-group "$RESOURCE_GROUP" --query key1 -o tsv)
REGION="$LOCATION"

echo "\nAzure Speech resource created."
echo "Key: $KEY"
echo "Region: $REGION"
