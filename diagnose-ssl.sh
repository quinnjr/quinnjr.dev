#!/bin/bash
# SSL/DNS Diagnostic Script for quinnjr.dev

set -e

echo "================================================"
echo "SSL/DNS Diagnostic for quinnjr.dev"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# 1. Check DNS Resolution
echo "1. Checking DNS Resolution..."
DNS_IPS=$(getent hosts quinnjr.dev | awk '{print $1}' | sort | uniq)
echo "   Domain resolves to:"
for ip in $DNS_IPS; do
    echo "   - $ip"

    # Check if it's AWS IP range
    if [[ $ip == 44.* ]] || [[ $ip == 52.* ]] || [[ $ip == 54.* ]]; then
        print_warning "This appears to be an AWS IP address"
        echo "      Your app is configured for DigitalOcean, not AWS!"
    fi
done
echo ""

# 2. Test HTTPS Connection
echo "2. Testing HTTPS Connection..."
HTTP_TEST=$(curl -sI -o /dev/null -w "%{http_code}" https://quinnjr.dev 2>/dev/null || echo "000")
if [ "$HTTP_TEST" == "000" ]; then
    print_status 1 "HTTPS connection failed - SSL/TLS handshake error"
    echo "   This is expected if DNS points to wrong infrastructure"
else
    print_status 0 "HTTPS connection successful (HTTP $HTTP_TEST)"
fi
echo ""

# 3. Check if DigitalOcean token is configured
echo "3. Checking Terraform Configuration..."
if [ -f "tf/terraform.tfvars" ]; then
    print_status 0 "terraform.tfvars exists"

    # Check for required variables
    if grep -q "do_token" tf/terraform.tfvars; then
        print_status 0 "DigitalOcean token configured"
    else
        print_status 1 "DigitalOcean token missing"
    fi

    if grep -q "domain_name.*quinnjr.dev" tf/terraform.tfvars; then
        print_status 0 "Domain name configured (quinnjr.dev)"
    else
        print_status 1 "Domain name not configured correctly"
    fi

    if grep -q "enable_dns.*true" tf/terraform.tfvars; then
        print_status 0 "DNS management enabled in Terraform"
    else
        print_warning "DNS management disabled in Terraform (manual DNS required)"
    fi
else
    print_status 1 "terraform.tfvars not found"
fi
echo ""

# 4. Check for Spaces credentials (needed for Terraform backend)
echo "4. Checking DigitalOcean Spaces Credentials..."
if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
    print_status 0 "Spaces credentials found in environment"
else
    print_status 1 "Spaces credentials not configured"
    echo "   Required for Terraform backend (DigitalOcean Spaces)"
    echo "   Set with:"
    echo "     export AWS_ACCESS_KEY_ID='your_key'"
    echo "     export AWS_SECRET_ACCESS_KEY='your_secret'"
fi
echo ""

# 5. Check Terraform state
echo "5. Checking Terraform State..."
cd tf
if [ -d ".terraform" ]; then
    print_status 0 "Terraform initialized"
else
    print_status 1 "Terraform not initialized"
    echo "   Run: cd tf && terraform init -reconfigure"
fi
cd ..
echo ""

# 6. Summary and Recommendations
echo "================================================"
echo "SUMMARY & RECOMMENDATIONS"
echo "================================================"
echo ""

echo "🔍 DIAGNOSIS:"
echo "   Your domain 'quinnjr.dev' is currently pointing to AWS infrastructure,"
echo "   but your Terraform configuration expects DigitalOcean App Platform."
echo ""

echo "⚠️  ROOT CAUSE:"
echo "   DNS mismatch causing SSL/TLS handshake failure"
echo ""

echo "📋 RECOMMENDED ACTIONS:"
echo ""
echo "   Option A: Use DigitalOcean DNS (Recommended)"
echo "   ─────────────────────────────────────────────"
echo "   1. Get Spaces credentials from DigitalOcean"
echo "      → https://cloud.digitalocean.com/account/api/spaces"
echo ""
echo "   2. Export credentials:"
echo "      export AWS_ACCESS_KEY_ID='your_key'"
echo "      export AWS_SECRET_ACCESS_KEY='your_secret'"
echo ""
echo "   3. Initialize and apply Terraform:"
echo "      cd tf"
echo "      terraform init -reconfigure"
echo "      terraform plan"
echo "      terraform apply"
echo ""
echo "   4. Update nameservers at your domain registrar to:"
echo "      - ns1.digitalocean.com"
echo "      - ns2.digitalocean.com"
echo "      - ns3.digitalocean.com"
echo ""
echo "   Option B: Manual DNS Update"
echo "   ───────────────────────────"
echo "   1. Get your DigitalOcean app URL:"
echo "      → Log into https://cloud.digitalocean.com"
echo "      → Go to App Platform → Your App"
echo "      → Copy the default app URL"
echo ""
echo "   2. Update DNS at your current provider:"
echo "      → Delete A records pointing to 44.227.x.x"
echo "      → Create CNAME to your-app.ondigitalocean.app"
echo ""
echo "   3. Add domain in DigitalOcean App Platform:"
echo "      → Settings → Domains → Add Domain"
echo "      → Enter: quinnjr.dev"
echo ""

echo ""
echo "📖 For detailed instructions, see: SSL-TROUBLESHOOTING.md"
echo ""

