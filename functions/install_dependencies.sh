#!/bin/bash

# Install dependencies for Firebase functions
cd /Users/dambert.munoz/Documents/shortcat/shortcatplatform/functions

# Install required dependencies
npm install express firebase-admin firebase-functions cors uuid

# Install required dev dependencies for TypeScript type definitions
npm install -D @types/express @types/cors @types/uuid typescript firebase-functions-test

echo "Dependencies installed successfully!"
