#!/bin/bash
# =============================================================================
# Database Seed Script
# =============================================================================
# This script runs the seed.sql file to populate the database with
# deterministic seed data for local development.
#
# The seed file creates:
#   - Default organization (UVM Children's Hospital)
#   - Skills, supportive adult types, help methods, crisis resources
#   - Admin provider account (configured directly in seed.sql)
#
# Usage:
#   ./scripts/seed-db.sh
#
# To change the admin email, edit supabase/seed.sql directly.
#
# Requirements:
#   - Supabase CLI must be installed and running (supabase start)
#   - Or configure DATABASE_URL for direct connection
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}WBAP Database Seed Script${NC}"
echo "=================================="

# Check if we're using Supabase CLI or direct connection
if command -v supabase &> /dev/null; then
    echo -e "${GREEN}Using Supabase CLI for seeding...${NC}"

    # Run the main seed file
    supabase db reset --seed-only 2>/dev/null || supabase db seed
else
    echo -e "${RED}Supabase CLI not found. Using direct PostgreSQL connection...${NC}"

    if [ -z "$DATABASE_URL" ]; then
        echo -e "${RED}Error: DATABASE_URL environment variable is not set${NC}"
        echo "Please set DATABASE_URL or install Supabase CLI"
        exit 1
    fi

    # Run the main seed file
    psql "$DATABASE_URL" -f supabase/seed.sql
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
echo "  - 1 admin provider (see supabase/seed.sql for email)"
echo ""
echo "Done!"
