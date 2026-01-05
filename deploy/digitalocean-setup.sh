#!/bin/bash
# Digital Ocean Droplet Setup Script
# For Ubuntu 22.04 LTS (cheapest $6/month droplet)

set -e

echo "🚀 Setting up QuinnJR.dev on Digital Ocean..."

# Update system
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
rm get-docker.sh

# Install Docker Compose
echo "📦 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
echo "📦 Installing Git..."
sudo apt-get install -y git

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /opt/quinnjr.dev
sudo chown $USER:$USER /opt/quinnjr.dev
cd /opt/quinnjr.dev

# Clone repository (you'll need to set this up)
echo "📥 Clone your repository manually:"
echo "  cd /opt/quinnjr.dev"
echo "  git clone <your-repo-url> ."

# Create .env file
echo "📝 Creating .env file..."
cat > .env << 'EOF'
NODE_ENV=production
PORT=4000
DATABASE_URL=file:/data/quinnjr.db
AUTH0_DOMAIN=dev-skrc3oude0nhleqs.us.auth0.com
AUTH0_AUDIENCE=https://quinnjr.dev
EOF

echo "✏️  Please edit .env with your actual values:"
echo "  nano /opt/quinnjr.dev/.env"

# Create data directory
echo "📁 Creating data directory..."
mkdir -p ./data
mkdir -p ./logs
chmod 777 ./data

# Install firewall
echo "🔥 Setting up firewall..."
sudo apt-get install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 4000/tcp
sudo ufw --force enable

# Install Nginx (optional - for reverse proxy)
echo "🌐 Installing Nginx..."
sudo apt-get install -y nginx
sudo systemctl enable nginx

# Create Nginx configuration
echo "📝 Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/quinnjr.dev > /dev/null << 'EOF'
server {
    listen 80;
    server_name quinnjr.dev www.quinnjr.dev;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/quinnjr.dev /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# Install Certbot for SSL
echo "🔒 Installing Certbot for SSL..."
sudo apt-get install -y certbot python3-certbot-nginx

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Clone your repository:"
echo "   cd /opt/quinnjr.dev && git clone <your-repo-url> ."
echo ""
echo "2. Edit .env file:"
echo "   nano /opt/quinnjr.dev/.env"
echo ""
echo "3. Build and start the application:"
echo "   cd /opt/quinnjr.dev"
echo "   docker-compose up -d --build"
echo ""
echo "4. Set up SSL certificate:"
echo "   sudo certbot --nginx -d quinnjr.dev -d www.quinnjr.dev"
echo ""
echo "5. Set up automated backups:"
echo "   ./deploy/setup-backups.sh"
echo ""
echo "💰 Monthly cost: ~$6/month (Basic Droplet)"
