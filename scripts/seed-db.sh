#!/bin/bash
# =============================================================================
# Database Seed Script
# =============================================================================
# This script runs the seed.sql file and optionally creates an admin provider
# based on environment variables.
#
# Environment Variables:
#   SEED_ADMIN_EMAIL  - Email for the admin provider (triggers admin creation)
#   SEED_ORG_NAME     - Organization name (optional, defaults to UVM Children's Hospital)
#
# Usage:
#   ./scripts/seed-db.sh                                    # Run seed only
#   SEED_ADMIN_EMAIL=admin@example.com ./scripts/seed-db.sh # With admin user
#
# Requirements:
#   - Supabase CLI must be installed and running (supabase start)
#   - Or configure DATABASE_URL for direct connection
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}WBAP Database Seed Script${NC}"
echo "=================================="

# Check if we're using Supabase CLI or direct connection
if command -v supabase &> /dev/null; then
    echo -e "${GREEN}Using Supabase CLI for seeding...${NC}"

    # Run the main seed file
    supabase db reset --seed-only 2>/dev/null || supabase db seed

    # If SEED_ADMIN_EMAIL is set, create the admin provider
    if [ -n "$SEED_ADMIN_EMAIL" ]; then
        echo -e "${YELLOW}Creating admin provider: $SEED_ADMIN_EMAIL${NC}"

        # Get the database URL from Supabase
        DB_URL=$(supabase status --output json 2>/dev/null | grep -o '"DB URL": "[^"]*"' | cut -d'"' -f4)

        if [ -n "$DB_URL" ]; then
            psql "$DB_URL" -c "SELECT seed_admin_provider('$SEED_ADMIN_EMAIL');"
            echo -e "${GREEN}Admin provider created successfully!${NC}"
        else
            echo -e "${RED}Could not get database URL from Supabase${NC}"
            echo "You can manually create the admin by running:"
            echo "  SELECT seed_admin_provider('$SEED_ADMIN_EMAIL');"
        fi
    fi
else
    echo -e "${YELLOW}Supabase CLI not found. Using direct PostgreSQL connection...${NC}"

    if [ -z "$DATABASE_URL" ]; then
        echo -e "${RED}Error: DATABASE_URL environment variable is not set${NC}"
        echo "Please set DATABASE_URL or install Supabase CLI"
        exit 1
    fi

    # Run the main seed file
    psql "$DATABASE_URL" -f supabase/seed.sql

    # If SEED_ADMIN_EMAIL is set, create the admin provider
    if [ -n "$SEED_ADMIN_EMAIL" ]; then
        echo -e "${YELLOW}Creating admin provider: $SEED_ADMIN_EMAIL${NC}"
        psql "$DATABASE_URL" -c "SELECT seed_admin_provider('$SEED_ADMIN_EMAIL');"
        echo -e "${GREEN}Admin provider created successfully!${NC}"
    fi
fi

echo ""
echo -e "${GREEN}Seed completed!${NC}"
echo ""
echo "Database now contains:"
echo "  - 1 organization: UVM Children's Hospital"
echo "  - 21 skills (physical, creative, social, mindfulness)"
echo "  - 7 supportive adult types"
echo "  - 4 help methods"
echo "  - 2 crisis resources"

if [ -n "$SEED_ADMIN_EMAIL" ]; then
    echo "  - Admin provider: $SEED_ADMIN_EMAIL"
fi

echo ""
echo "Done!"
