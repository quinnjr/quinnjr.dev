#!/bin/bash
# Automated Digital Ocean Deployment Script
# Deploy your entire site with one command!

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_step() {
    echo -e "\n${BLUE}==== $1 ====${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if running on local machine or on server
if [[ "$1" == "--server" ]]; then
    IS_SERVER=true
    print_step "Running in SERVER mode"
else
    IS_SERVER=false
    print_step "Running in LOCAL mode"
fi

# ASCII Art Banner
cat << "EOF"
  ____        _       _        _    ___
 |  _ \  __ _(_) __ _(_)_ __  | |  / _ \  ___ ___  __ _ _ __
 | | | |/ _` | |/ _` | | '_ \ | | | | | |/ __/ _ \/ _` | '_ \
 | |_| | (_| | | (_| | | | | || | | |_| | (_|  __/ (_| | | | |
 |____/ \__,_|_|\__, |_|_| |_||_|  \___/ \___\___|\__,_|_| |_|
                |___/
  ____             _                                   _
 |  _ \  ___ _ __ | | ___  _   _ _ __ ___   ___ _ __ | |_
 | | | |/ _ \ '_ \| |/ _ \| | | | '_ ` _ \ / _ \ '_ \| __|
 | |_| |  __/ |_) | | (_) | |_| | | | | | |  __/ | | | |_
 |____/ \___| .__/|_|\___/ \__, |_| |_| |_|\___|_| |_|\__|
            |_|            |___/

QuinnJR.dev - $6/month Digital Ocean Deployment
EOF

echo -e "\n${GREEN}This script will deploy your site to Digital Ocean automatically!${NC}\n"

# ============================================================================
# LOCAL MACHINE: Prepare and connect to server
# ============================================================================

if [[ "$IS_SERVER" == false ]]; then
    print_step "Step 1: Prerequisites Check"

    # Check for doctl
    if ! command -v doctl &> /dev/null; then
        print_warning "doctl not found. Installing Digital Ocean CLI..."

        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            cd /tmp
            curl -sL https://github.com/digitalocean/doctl/releases/download/v1.104.0/doctl-1.104.0-linux-amd64.tar.gz | tar -xzv
            sudo mv doctl /usr/local/bin
            cd - > /dev/null
            print_success "doctl installed"
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            if command -v brew &> /dev/null; then
                brew install doctl
                print_success "doctl installed via Homebrew"
            else
                print_error "Please install doctl manually: https://docs.digitalocean.com/reference/doctl/how-to/install/"
                exit 1
            fi
        else
            print_error "Please install doctl manually: https://docs.digitalocean.com/reference/doctl/how-to/install/"
            exit 1
        fi
    else
        print_success "doctl found"
    fi

    # Check for SSH key
    if [ ! -f ~/.ssh/id_ed25519.pub ] && [ ! -f ~/.ssh/id_rsa.pub ]; then
        print_warning "No SSH key found. Generating one..."
        ssh-keygen -t ed25519 -C "quinnjr-deployment" -f ~/.ssh/id_ed25519 -N ""
        print_success "SSH key generated: ~/.ssh/id_ed25519"
    else
        print_success "SSH key found"
    fi

    # Get SSH key path and content
    if [ -f ~/.ssh/id_ed25519.pub ]; then
        SSH_KEY_PATH=~/.ssh/id_ed25519.pub
        SSH_KEY_CONTENT=$(cat ~/.ssh/id_ed25519.pub)
    else
        SSH_KEY_PATH=~/.ssh/id_rsa.pub
        SSH_KEY_CONTENT=$(cat ~/.ssh/id_rsa.pub)
    fi

    print_step "Step 2: Digital Ocean Authentication"

    # Check if already authenticated
    if doctl auth list 2>/dev/null | grep -q "current"; then
        print_success "Already authenticated with Digital Ocean"
    else
        echo "You need a Digital Ocean API token."
        echo "Get one here: https://cloud.digitalocean.com/account/api/tokens"
        echo ""
        echo "Create a new token with:"
        echo "  - Name: quinnjr-deployment"
        echo "  - Scopes: Read & Write"
        echo ""
        read -s -p "Enter your Digital Ocean API token: " DO_TOKEN
        echo ""

        doctl auth init --access-token "$DO_TOKEN"

        if doctl account get &>/dev/null; then
            print_success "Authentication successful"
        else
            print_error "Authentication failed. Please check your token."
            exit 1
        fi
    fi

    print_step "Step 3: Droplet Configuration"

    read -p "Do you want to create a NEW droplet? (y/n): " CREATE_NEW

    if [[ "$CREATE_NEW" =~ ^[Yy]$ ]]; then
        # Upload SSH key to Digital Ocean if not already there
        SSH_KEY_NAME="quinnjr-deployment-$(date +%s)"
        SSH_KEY_FINGERPRINT=$(ssh-keygen -lf $SSH_KEY_PATH | awk '{print $2}')

        if doctl compute ssh-key list | grep -q "$SSH_KEY_FINGERPRINT"; then
            print_success "SSH key already in Digital Ocean"
            SSH_KEY_ID=$(doctl compute ssh-key list --format ID,Fingerprint --no-header | grep "$SSH_KEY_FINGERPRINT" | awk '{print $1}')
        else
            print_warning "Uploading SSH key to Digital Ocean..."
            SSH_KEY_ID=$(doctl compute ssh-key create "$SSH_KEY_NAME" --public-key "$SSH_KEY_CONTENT" --format ID --no-header)
            print_success "SSH key uploaded (ID: $SSH_KEY_ID)"
        fi

        # Show available regions
        echo -e "\n${YELLOW}Available regions (closest to you):${NC}"
        doctl compute region list --format Slug,Name,Available --no-header | grep true | head -10

        echo -e "\n${YELLOW}Recommended regions:${NC}"
        echo "  nyc1, nyc3 - New York"
        echo "  sfo3 - San Francisco"
        echo "  lon1 - London"
        echo "  fra1 - Frankfurt"
        echo "  sgp1 - Singapore"
        echo ""

        read -p "Enter region (default: nyc3): " REGION
        REGION=${REGION:-nyc3}

        DROPLET_NAME="quinnjr-dev-$(date +%s)"

        echo -e "\n${YELLOW}Creating droplet...${NC}"
        echo "  Name: $DROPLET_NAME"
        echo "  Region: $REGION"
        echo "  Size: s-1vcpu-1gb (\$6/month)"
        echo "  Image: ubuntu-22-04-x64"
        echo ""

        # Create the droplet
        DROPLET_ID=$(doctl compute droplet create "$DROPLET_NAME" \
            --region "$REGION" \
            --size s-1vcpu-1gb \
            --image ubuntu-22-04-x64 \
            --ssh-keys "$SSH_KEY_ID" \
            --wait \
            --format ID \
            --no-header)

        if [[ -z "$DROPLET_ID" ]]; then
            print_error "Failed to create droplet"
            exit 1
        fi

        print_success "Droplet created! (ID: $DROPLET_ID)"

        # Wait for droplet to be fully ready
        echo -n "Waiting for droplet to be ready..."
        sleep 10
        for i in {1..30}; do
            if doctl compute droplet get "$DROPLET_ID" --format Status --no-header | grep -q "active"; then
                echo ""
                print_success "Droplet is active!"
                break
            fi
            echo -n "."
            sleep 2
        done

        # Get the IP address
        DROPLET_IP=$(doctl compute droplet get "$DROPLET_ID" --format PublicIPv4 --no-header)
        print_success "Droplet IP: $DROPLET_IP"

        echo -e "\n${GREEN}Droplet Details:${NC}"
        doctl compute droplet get "$DROPLET_ID" --format ID,Name,PublicIPv4,Memory,VCPUs,Disk,Region,Status

        # Wait a bit more for SSH to be ready
        echo -n "Waiting for SSH to be ready..."
        for i in {1..30}; do
            if ssh -o StrictHostKeyChecking=no -o ConnectTimeout=2 root@$DROPLET_IP "echo 'SSH ready'" &>/dev/null; then
                echo ""
                print_success "SSH is ready!"
                break
            fi
            echo -n "."
            sleep 5
        done

    else
        # Use existing droplet
        echo -e "\n${YELLOW}Your existing droplets:${NC}"
        doctl compute droplet list --format ID,Name,PublicIPv4,Status
        echo ""

        read -p "Enter droplet ID or IP address: " DROPLET_INPUT

        if [[ $DROPLET_INPUT =~ ^[0-9]+$ ]]; then
            # It's a droplet ID
            DROPLET_IP=$(doctl compute droplet get "$DROPLET_INPUT" --format PublicIPv4 --no-header)
            if [[ -z "$DROPLET_IP" ]]; then
                print_error "Droplet not found"
                exit 1
            fi
            print_success "Using droplet IP: $DROPLET_IP"
        elif [[ $DROPLET_INPUT =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            # It's an IP address
            DROPLET_IP="$DROPLET_INPUT"
            print_success "Using IP: $DROPLET_IP"
        else
            print_error "Invalid droplet ID or IP address"
            exit 1
        fi
    fi

    print_step "Step 4: Domain Configuration"

    # Ask about domain
    read -p "Do you have a domain name? (y/n): " HAS_DOMAIN

    if [[ "$HAS_DOMAIN" =~ ^[Yy]$ ]]; then
        read -p "Enter your domain (e.g., quinnjr.dev): " DOMAIN_NAME
        print_success "Domain: $DOMAIN_NAME"

        print_warning "Make sure to configure DNS:"
        echo "  1. Add domain in Digital Ocean (Networking → Domains)"
        echo "  2. Create A record: @ → $DROPLET_IP"
        echo "  3. Create A record: www → $DROPLET_IP"
        echo "  4. Update nameservers at your domain registrar"
        echo ""
        read -p "Press Enter when DNS is configured (or to continue anyway)..."
    else
        DOMAIN_NAME=""
        print_warning "Will use IP address (no SSL available)"
    fi

    # Auth0 credentials
    print_step "Step 5: Auth0 Configuration"

    echo "Default Auth0 settings:"
    echo "  Domain: dev-skrc3oude0nhleqs.us.auth0.com"
    echo "  Audience: https://quinnjr.dev"
    echo ""
    read -p "Use default Auth0 settings? (y/n): " USE_DEFAULT_AUTH0

    if [[ "$USE_DEFAULT_AUTH0" =~ ^[Yy]$ ]]; then
        AUTH0_DOMAIN="dev-skrc3oude0nhleqs.us.auth0.com"
        AUTH0_AUDIENCE="https://quinnjr.dev"
    else
        read -p "Enter Auth0 Domain: " AUTH0_DOMAIN
        read -p "Enter Auth0 Audience: " AUTH0_AUDIENCE
    fi

    # GitHub repository
    print_step "Step 6: Repository Configuration"

    read -p "Enter your GitHub repository URL (or press Enter to skip): " GITHUB_REPO

    if [[ -z "$GITHUB_REPO" ]]; then
        print_warning "No repository URL provided. You'll need to copy files manually."
        USE_GIT=false
    else
        print_success "Will clone from: $GITHUB_REPO"
        USE_GIT=true
    fi

    # Summary
    print_step "Deployment Summary"
    echo "Droplet IP:     $DROPLET_IP"
    echo "Domain:         ${DOMAIN_NAME:-None (using IP)}"
    echo "Auth0 Domain:   $AUTH0_DOMAIN"
    echo "Auth0 Audience: $AUTH0_AUDIENCE"
    echo "GitHub Repo:    ${GITHUB_REPO:-None}"
    echo ""
    read -p "Ready to deploy? (y/n): " CONFIRM

    if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
        print_error "Deployment cancelled"
        exit 0
    fi

    # Test SSH connection
    print_step "Step 7: Testing SSH Connection"

    if ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@$DROPLET_IP "echo 'SSH connection successful'" 2>/dev/null; then
        print_success "SSH connection established"
    else
        print_error "Cannot connect via SSH. Please check:"
        echo "  1. Droplet is running"
        echo "  2. IP address is correct"
        echo "  3. SSH key was added to droplet"
        exit 1
    fi

    # Copy this script to server
    print_step "Step 8: Copying Deployment Script to Server"

    ssh root@$DROPLET_IP "mkdir -p /tmp/deployment"
    scp "$0" root@$DROPLET_IP:/tmp/deployment/auto-deploy.sh
    scp -r deploy/* root@$DROPLET_IP:/tmp/deployment/ 2>/dev/null || true

    # Create config file
    cat > /tmp/deploy-config.env << EOF
DROPLET_IP=$DROPLET_IP
DOMAIN_NAME=$DOMAIN_NAME
AUTH0_DOMAIN=$AUTH0_DOMAIN
AUTH0_AUDIENCE=$AUTH0_AUDIENCE
GITHUB_REPO=$GITHUB_REPO
USE_GIT=$USE_GIT
EOF

    scp /tmp/deploy-config.env root@$DROPLET_IP:/tmp/deployment/

    print_success "Files copied to server"

    # Run script on server
    print_step "Step 9: Running Server Setup"
    echo -e "${YELLOW}Connecting to server and starting installation...${NC}\n"

    ssh -t root@$DROPLET_IP "cd /tmp/deployment && bash auto-deploy.sh --server"

    # Done!
    print_step "🎉 Deployment Complete!"

    echo -e "\nYour site is now live!"
    if [[ -n "$DOMAIN_NAME" ]]; then
        echo -e "  URL: ${GREEN}https://$DOMAIN_NAME${NC}"
        echo -e "  API: ${GREEN}https://$DOMAIN_NAME/api/resume/public${NC}"
        echo -e "  Admin: ${GREEN}https://$DOMAIN_NAME/admin${NC}"
    else
        echo -e "  URL: ${GREEN}http://$DROPLET_IP${NC}"
        echo -e "  API: ${GREEN}http://$DROPLET_IP/api/resume/public${NC}"
        echo -e "  Admin: ${GREEN}http://$DROPLET_IP/admin${NC}"
    fi

    echo -e "\nUseful commands:"
    echo "  SSH: ssh root@$DROPLET_IP"
    echo "  Logs: docker-compose logs -f"
    echo "  Restart: docker-compose restart"
    echo "  Update: ./deploy/deploy.sh"

    echo -e "\n${YELLOW}Don't forget to:${NC}"
    echo "  1. Update Auth0 callback URLs with your domain"
    echo "  2. Test the /admin login"
    echo "  3. Set up monitoring (uptimerobot.com)"

    exit 0
fi

# ============================================================================
# SERVER: Run on Digital Ocean droplet
# ============================================================================

print_step "Installing on Digital Ocean Server"

# Load configuration
if [ -f /tmp/deployment/deploy-config.env ]; then
    source /tmp/deployment/deploy-config.env
    print_success "Configuration loaded"
else
    print_error "Configuration file not found"
    exit 1
fi

# Update system
print_step "Updating System Packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
print_success "System updated"

# Install Docker
print_step "Installing Docker"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    print_success "Docker installed"
else
    print_success "Docker already installed"
fi

# Install Docker Compose
print_step "Installing Docker Compose"
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
        -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose installed"
else
    print_success "Docker Compose already installed"
fi

# Install other tools
print_step "Installing Additional Tools"
apt-get install -y -qq git nginx certbot python3-certbot-nginx ufw curl
print_success "Tools installed"

# Configure firewall
print_step "Configuring Firewall"
ufw --force default deny incoming
ufw --force default allow outgoing
ufw --force allow ssh
ufw --force allow 80/tcp
ufw --force allow 443/tcp
ufw --force allow 4000/tcp
ufw --force enable
print_success "Firewall configured"

# Create application directory
print_step "Setting Up Application Directory"
mkdir -p /opt/quinnjr.dev
cd /opt/quinnjr.dev
print_success "Directory created: /opt/quinnjr.dev"

# Clone or copy repository
print_step "Deploying Code"

if [[ "$USE_GIT" == true ]]; then
    if [ -d /opt/quinnjr.dev/.git ]; then
        print_warning "Repository already exists, pulling latest..."
        git pull
    else
        git clone $GITHUB_REPO .
    fi
    print_success "Code cloned from repository"
else
    # Copy deployment files
    cp -r /tmp/deployment/* /opt/quinnjr.dev/ 2>/dev/null || true
    print_warning "Files copied (no git repository)"
fi

# Create environment file
print_step "Creating Environment Configuration"

cat > /opt/quinnjr.dev/.env << EOF
NODE_ENV=production
PORT=4000
DATABASE_URL="file:/data/quinnjr.db"
AUTH0_DOMAIN="$AUTH0_DOMAIN"
AUTH0_AUDIENCE="$AUTH0_AUDIENCE"
EOF

print_success "Environment file created"

# Create necessary directories
mkdir -p /opt/quinnjr.dev/data
mkdir -p /opt/quinnjr.dev/backups
mkdir -p /opt/quinnjr.dev/logs
chmod 777 /opt/quinnjr.dev/data
print_success "Data directories created"

# Build and start Docker container
print_step "Building and Starting Application"

if [ -f /opt/quinnjr.dev/docker-compose.yml ]; then
    docker-compose down 2>/dev/null || true
    docker-compose up -d --build
    print_success "Application started"

    # Wait for application to be ready
    echo -n "Waiting for application to start..."
    for i in {1..30}; do
        if curl -f http://localhost:4000/api/resume/public &>/dev/null; then
            echo ""
            print_success "Application is running!"
            break
        fi
        echo -n "."
        sleep 2
    done
    echo ""
else
    print_error "docker-compose.yml not found"
    print_warning "You'll need to deploy your code manually"
fi

# Configure Nginx
print_step "Configuring Nginx Reverse Proxy"

if [[ -n "$DOMAIN_NAME" ]]; then
    # With domain
    cat > /etc/nginx/sites-available/quinnjr.dev << EOF
server {
    listen 80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
else
    # Without domain (IP only)
    cat > /etc/nginx/sites-available/quinnjr.dev << EOF
server {
    listen 80 default_server;
    server_name _;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
fi

ln -sf /etc/nginx/sites-available/quinnjr.dev /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

if nginx -t 2>/dev/null; then
    systemctl restart nginx
    print_success "Nginx configured"
else
    print_error "Nginx configuration error"
fi

# Set up SSL if domain is provided
if [[ -n "$DOMAIN_NAME" ]]; then
    print_step "Setting Up SSL Certificate"

    # Check if domain resolves to this server
    RESOLVED_IP=$(dig +short $DOMAIN_NAME | tail -n1)
    SERVER_IP=$(curl -s ifconfig.me)

    if [[ "$RESOLVED_IP" == "$SERVER_IP" ]]; then
        print_success "DNS is correctly configured"

        # Get SSL certificate
        certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME \
            --non-interactive --agree-tos --register-unsafely-without-email \
            --redirect 2>/dev/null || {
            print_warning "SSL setup failed. You can run manually later:"
            echo "  certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME"
        }

        if [ -f /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem ]; then
            print_success "SSL certificate installed"
        fi
    else
        print_warning "DNS not yet propagated (points to $RESOLVED_IP, should be $SERVER_IP)"
        print_warning "Run this later when DNS is ready:"
        echo "  certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME"
    fi
else
    print_warning "Skipping SSL (no domain configured)"
fi

# Set up automated backups
print_step "Setting Up Automated Backups"

if [ -f /opt/quinnjr.dev/deploy/setup-backups.sh ]; then
    chmod +x /opt/quinnjr.dev/deploy/*.sh
    /opt/quinnjr.dev/deploy/setup-backups.sh
    print_success "Backups configured (daily at 2 AM)"
else
    print_warning "Backup script not found, skipping"
fi

# Enable swap (helps with 1GB RAM)
print_step "Enabling Swap Memory"

if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    print_success "2GB swap enabled"
else
    print_success "Swap already configured"
fi

# Final status check
print_step "Final Status Check"

echo "Docker containers:"
docker-compose ps 2>/dev/null || docker ps

echo -e "\nDisk usage:"
df -h / | tail -1

echo -e "\nMemory usage:"
free -h | grep Mem

echo -e "\nApplication health:"
if curl -f http://localhost:4000/api/resume/public &>/dev/null; then
    print_success "API is responding"
else
    print_warning "API not responding yet (may still be starting)"
fi

# Summary
print_step "🎉 Server Setup Complete!"

echo -e "\nYour application is deployed!"
if [[ -n "$DOMAIN_NAME" ]]; then
    echo -e "  Domain: ${GREEN}http://$DOMAIN_NAME${NC}"
    echo -e "  (HTTPS will work once SSL is installed)"
else
    echo -e "  IP Address: ${GREEN}http://$DROPLET_IP${NC}"
fi

echo -e "\n${YELLOW}Useful Commands:${NC}"
echo "  View logs:        docker-compose logs -f"
echo "  Restart app:      docker-compose restart"
echo "  Deploy updates:   /opt/quinnjr.dev/deploy/deploy.sh"
echo "  Manual backup:    /opt/quinnjr.dev/deploy/backup-sqlite.sh"
echo "  Check status:     docker-compose ps"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "  1. Test your site in a browser"
echo "  2. Update Auth0 callback URLs"
echo "  3. Test the /admin login"
echo "  4. Set up monitoring (uptimerobot.com)"

print_success "Deployment complete! 🚀"
