# Kaarkun DevOps Documentation

This file documents only the DevOps side of the Kaarkun project. It is written to be understandable by teammates and thesis writers who need to know how deployment, infrastructure, and secret management are configured.

---

## 1. Purpose

This document explains:
- the GitHub Actions deployment pipeline,
- the Docker container builds,
- the Terraform-managed AWS infrastructure,
- the AWS services used,
- secret management and environment handling.


---

## 2. CI/CD: GitHub Actions

File: `.github/workflows/deploy-aws.yml`

### What it does

When the team pushes code to the `master` branch, GitHub Actions runs an automated deployment workflow.

### Workflow steps

1. `actions/checkout@v4`
   - Retrieves the repository contents.
2. `aws-actions/configure-aws-credentials@v4`
   - Sets AWS credentials from GitHub Secrets.
3. `aws-actions/amazon-ecr-login@v2`
   - Logs into Amazon ECR so Docker can push images.
4. Build and push Docker images for three apps:
   - `backend` from `./backend`
   - `frontend` from `./web/kaarkun`
   - `admin` from `./admin`
5. Update ECS services with `aws ecs update-service --force-new-deployment`
   - Causes each service to pull the new image and restart.

### Why this matters

This workflow automates deployment so developers do not manually rebuild images and restart services. It also keeps the live environment consistent with the `master` branch.

---

## 3. Docker builds

The project uses Docker to build isolated containers for each service.

### Backend container

File: `backend/Dockerfile`

- Base image: `node:20-alpine`
- Two-stage build:
  - `deps` stage installs production Node.js dependencies
  - final stage copies dependencies and source code
- Exposes port `5000`
- Runs as non-root user: `USER node`
- Startup command: `node app.js`

This design improves image size and security by installing dependencies in a separate stage and avoiding root execution.

### Admin panel container

File: `admin/Dockerfile`

- Base image: `node:20-alpine`
- Three-stage build:
  - `deps` installs dependencies
  - `build` compiles the Next.js admin app
  - `runner` copies production output and runs the server
- Exposes port `3000`
- Runs with `USER node`
- Startup command: `node server.js`

This separates dependency installation, build output, and runtime environment.

### Frontend container

File: `web/kaarkun/Dockerfile`

- Base image: `node:20-alpine`
- Two-stage build:
  - `build` installs dependencies and builds the Next.js app
  - `runner` copies the built app files and node modules
- Exposes port `3000`
- Runs as `USER node`
- Startup command: `npm start`

### Local Docker Compose

File: `docker-compose.yml`

This file is used for local development and connects services together with Docker networking.

Services:
- `db`: MySQL database container
- `backend`: backend API container
- `web`: frontend web container
- `admin`: admin panel container

Key points:
- Backend and DB are linked through Docker Compose network
- Backend uses environment variables from `backend/.env`
- MySQL initialization uses `backend/schema.sql`
- The `db` service has a healthcheck so the backend waits for the database to be ready

---

## 4. Terraform infrastructure

All AWS infrastructure is defined in `Terraform/`.

### Provider configuration

File: `Terraform/provider.tf`

- Sets the AWS provider region from `var.aws_region`

### Terraform variables

File: `Terraform/variables.tf`

Important variables:
- `aws_region`: AWS region for deployment
- `project_name`: base name for resources
- `environment`: env suffix such as `dev` or `prod`
- `vpc_cidr`: VPC address range
- `db_name`: default `academydev`
- `db_username`: default `academyadmin`
- `container_image_tag`: default `latest`
- `backend_container_port`: default `5000`
- `frontend_container_port`: default `3000`
- `admin_container_port`: default `3000`

### Terraform outputs

File: `Terraform/outputs.tf`

Outputs provide useful values after Terraform applies:
- `alb_dns_name`: ALB public endpoint
- `ecr_backend_repository_url`: ECR repo for backend
- `ecr_frontend_repository_url`: ECR repo for frontend
- `ecr_admin_repository_url`: ECR repo for admin
- `rds_endpoint`: MySQL endpoint
- `db_password`: generated database password (sensitive)

---

## 5. AWS services in use

The deployment uses the following AWS services:

- Amazon Elastic Container Registry (ECR)
  - Stores Docker images for backend, frontend, admin.
- Amazon Elastic Container Service (ECS) with Fargate
  - Runs containers without managing servers.
- Application Load Balancer (ALB)
  - Receives public HTTP traffic and routes it to ECS services.
- Amazon RDS (MySQL)
  - Stores application data in a managed MySQL database.
- Amazon CloudWatch Logs
  - Collects logs from ECS container tasks.
- AWS Identity and Access Management (IAM)
  - Provides ECS task execution role permissions.
- VPC networking
  - Controls public/private subnet structure, NAT gateway, and routing.

### ECS design

- One ECS cluster: `academy-dev-cluster`
- Three ECS services:
  - `academy-dev-backend`
  - `academy-dev-frontend`
  - `academy-dev-admin`
- Each service uses a Fargate task definition with 512 CPU and 1024 MB memory
- Each service is deployed in private subnets and receives traffic from the ALB

### Load balancer routing

- ALB listens on port 80
- Default route forwards to `frontend`
- Requests matching `/api/*` are routed to `backend`
- Requests matching `/admin` or `/admin/*` are routed to `admin`

---

## 6. Infrastructure network design

### VPC layout

- One VPC with CIDR `var.vpc_cidr`
- Two public subnets: `public_a`, `public_b`
- Two private subnets: `private_a`, `private_b`

### Public and private networking

- Public subnets host the NAT gateway and can receive external traffic
- Private subnets host ECS tasks and the RDS database
- Private ECS tasks do not have public IPs, improving security

### Internet access

- Public route table sends traffic to the Internet Gateway
- Private route table sends traffic through the NAT Gateway
- The NAT Gateway allows private ECS tasks to make outbound requests safely

### Security groups

- `alb` security group allows HTTP inbound from anywhere
- `ecs` security group allows traffic from the ALB only
- `rds` security group allows MySQL traffic from ECS only

---

## 7. Secret management

### GitHub Secrets

GitHub Actions uses these repository secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

These credentials are injected into the workflow and used to authenticate to AWS.

### Terraform secret handling

- Terraform generates a random password for the database with `random_password.db_password`
- The generated password is marked sensitive in outputs
- This avoids storing the database password directly in version control

### Local environment files

- `docker-compose.yml` references `backend/.env`
- Local development secrets are stored in `.env` files and not committed

### Current limitations

- The repository does not currently use AWS Secrets Manager or Parameter Store for app secrets
- Secret values are passed into ECS as environment variables from Terraform

---

## 8. Deployment flow summary

1. Code is pushed to `master`.
2. GitHub Actions runs the deployment workflow.
3. The workflow authenticates to AWS using GitHub Secrets.
4. Docker images for backend, frontend, and admin are built.
5. Images are pushed to ECR.
6. ECS services are updated to use the latest images.
7. The public ALB serves traffic to the application.

---

## 9. Files to review for DevOps

- `.github/workflows/deploy-aws.yml`
- `backend/Dockerfile`
- `admin/Dockerfile`
- `web/kaarkun/Dockerfile`
- `docker-compose.yml`
- `Terraform/provider.tf`
- `Terraform/variables.tf`
- `Terraform/outputs.tf`
- `Terraform/networking.tf`
- `Terraform/ecs.tf`
- `Terraform/versions.tf`

---

## 10. Notes for teammates

- This document is intentionally focused on deployment and infrastructure.
- Application-specific details should be found in the main project documentation or code comments.
- Teammates writing the thesis can use this file to explain the infrastructure and DevOps strategy.
