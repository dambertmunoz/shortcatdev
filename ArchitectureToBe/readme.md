## Architecture To Be

# Should be deploy in AWS Lambda 
# Use Postgres as database, also you can use no relation database like AWS dynamodb to improve performance
# Use AWS API Gateway to expose the API
# Use AWS Cognito for authentication
# Use AWS S3 for file storage
# Use AWS CloudFront for CDN
# Use AWS Route 53 for DNS
# Use AWS Certificate Manager for SSL
# Use AWS WAF for security
# Use AWS Shield for DDoS protection
# Use AWS X-Ray for monitoring
# Use AWS CloudWatch for logging
# Use AWS CloudFormation for infrastructure as code

# How to do transition from MVP to this architecture
# 1. Create a new environment in AWS
# 2. Migrate the database to AWS RDS or postgresql
# 3. Migrate the code to AWS Lambda (Should be easy because in MVP use firebase functions)
# 4. You can divide the repo in multirepos to be more scalable project
