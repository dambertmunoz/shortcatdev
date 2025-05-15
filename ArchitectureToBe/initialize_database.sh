#!/bin/bash
# ShortCat Platform Database Initialization Script
# Created: 2025-05-13, dambert.munoz
# Updated: 2025-05-15, dambert.munoz - Added remote server support

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}ShortCat Platform Database Initialization${NC}"
echo "This script will create and initialize the ShortCat Platform database."

# Check for required commands
for cmd in psql scp ssh; do
    if ! command -v $cmd &> /dev/null; then
        echo -e "${RED}Error: $cmd is required but not installed. Please install it and try again.${NC}"
        exit 1
    fi
done

# Connection type
echo -e "${BLUE}Connection Type${NC}"
echo "1) Local PostgreSQL server"
echo "2) Direct connection to remote PostgreSQL server (Supabase or AWS)"
echo "3) Remote PostgreSQL server via SSH tunnel"
read -p "Select connection type [2]: " CONN_TYPE
CONN_TYPE=${CONN_TYPE:-2}

# Database configuration
read -p "Enter database name [postgres]: " DB_NAME
DB_NAME=${DB_NAME:-postgres}

read -p "Enter database user [postgres]: " DB_USER
DB_USER=${DB_USER:-postgres}

read -s -p "Enter database password [Wdasedbi8thor*]: " DB_PASSWORD
DB_PASSWORD=${DB_PASSWORD:-password}
echo ""

read -p "Enter database host [db.labkugifzprpjnbltqec.supabase.co]: " DB_HOST
DB_HOST=${DB_HOST:-xyz}

read -p "Enter database port [5432]: " DB_PORT
DB_PORT=${DB_PORT:-5432}

# SSH tunnel configuration if needed
SSH_TUNNEL_ACTIVE=0
LOCAL_PORT=$DB_PORT

if [ "$CONN_TYPE" == "3" ]; then
    echo -e "\n${BLUE}SSH Tunnel Configuration${NC}"
    read -p "Enter SSH username: " SSH_USER
    read -p "Enter SSH host: " SSH_HOST
    read -p "Enter SSH port [22]: " SSH_PORT
    SSH_PORT=${SSH_PORT:-22}
    read -p "Enter local port for tunnel [15432]: " LOCAL_PORT
    LOCAL_PORT=${LOCAL_PORT:-15432}
    
    # Start SSH tunnel
    echo -e "${YELLOW}Setting up SSH tunnel...${NC}"
    ssh -f -N -L $LOCAL_PORT:$DB_HOST:$DB_PORT $SSH_USER@$SSH_HOST -p $SSH_PORT
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to create SSH tunnel. Exiting.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}SSH tunnel established successfully.${NC}"
    SSH_TUNNEL_ACTIVE=1
    
    # For psql commands, we'll connect to localhost through the tunnel
    DB_HOST_ORIG=$DB_HOST
    DB_PORT_ORIG=$DB_PORT
    DB_HOST="localhost"
    DB_PORT=$LOCAL_PORT
fi

# SQL file location
echo -e "\n${BLUE}SQL Files Location${NC}"
echo "1) Local directory (current path)"
echo "2) Remote server (will be copied locally)"
read -p "Select SQL files location [1]: " SQL_LOCATION
SQL_LOCATION=${SQL_LOCATION:-1}

if [ "$SQL_LOCATION" == "2" ]; then
    echo -e "\n${BLUE}Remote SQL Files Configuration${NC}"
    read -p "Enter remote username: " REMOTE_USER
    read -p "Enter remote host: " REMOTE_HOST
    read -p "Enter remote path to SQL files: " REMOTE_PATH
    read -p "Enter local temporary directory [/tmp/shortcat_sql]: " LOCAL_TEMP_DIR
    LOCAL_TEMP_DIR=${LOCAL_TEMP_DIR:-/tmp/shortcat_sql}
    
    # Create local temp directory
    mkdir -p $LOCAL_TEMP_DIR
    
    # Copy SQL files from remote server
    echo -e "${YELLOW}Copying SQL files from remote server...${NC}"
    scp $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/database_schema_*.sql $LOCAL_TEMP_DIR/
    scp $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/sample_data.sql $LOCAL_TEMP_DIR/ 2>/dev/null
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to copy SQL files. Check your connection and paths. Exiting.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}SQL files copied successfully.${NC}"
    
    # Change to the temp directory
    cd $LOCAL_TEMP_DIR
fi

# Export password for psql
export PGPASSWORD=$DB_PASSWORD

# Function to execute SQL file
execute_sql_file() {
    local file=$1
    echo -e "\n${YELLOW}Executing $file...${NC}"
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $file
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error executing $file. Exiting.${NC}"
        
        # Clean up SSH tunnel if active
        if [ $SSH_TUNNEL_ACTIVE -eq 1 ]; then
            echo -e "${YELLOW}Closing SSH tunnel...${NC}"
            pkill -f "ssh -f -N -L $LOCAL_PORT:$DB_HOST_ORIG:$DB_PORT_ORIG"
        fi
        
        # Clean up temp directory if used
        if [ "$SQL_LOCATION" == "2" ] && [ -d "$LOCAL_TEMP_DIR" ]; then
            echo -e "${YELLOW}Cleaning up temporary files...${NC}"
            rm -rf "$LOCAL_TEMP_DIR"
        fi
        
        exit 1
    fi
    
    echo -e "${GREEN}Successfully executed $file.${NC}"
}

# Order of execution is important due to dependencies
echo -e "\n${BLUE}Database Schema Files${NC}"
echo "The following SQL files will be executed in order:"

FILES=(
    "database_schema_part1.sql"           # Core tables, extensions, enums
    "database_schema_part2.sql"           # Purchase orders & requisitions
    "database_schema_part3.sql"           # Auctions, supplier evaluation & help desk
    "database_schema_part4.sql"           # Price comparison, traceability & reporting
    "database_schema_quotations.sql"      # Quotation system
    "database_schema_split_purchases.sql" # Split purchases functionality
    "database_schema_inventory.sql"       # Inventory system
    "database_schema_dual_role.sql"       # Dual role companies
)

# Print the files with their descriptions
for i in "${!FILES[@]}"; do
    file=${FILES[$i]}
    description=${file#*# }
    echo -e "${i+1}. ${YELLOW}${file%% *}${NC} - ${description}"
done

read -p "\nDo you want to continue with database initialization? (y/n) [y]: " CONTINUE
CONTINUE=${CONTINUE:-y}

if [[ $CONTINUE != "y" && $CONTINUE != "Y" ]]; then
    echo -e "${RED}Database initialization aborted.${NC}"
    exit 0
fi

echo -e "\n${YELLOW}Testing database connection...${NC}"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to connect to PostgreSQL server. Please check your connection details.${NC}"
    
    # Clean up SSH tunnel if active
    if [ $SSH_TUNNEL_ACTIVE -eq 1 ]; then
        echo -e "${YELLOW}Closing SSH tunnel...${NC}"
        pkill -f "ssh -f -N -L $LOCAL_PORT:$DB_HOST_ORIG:$DB_PORT_ORIG"
    fi
    
    exit 1
fi

echo -e "${GREEN}Database connection successful.${NC}"

# Execute each file in order
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        execute_sql_file "$file"
    else
        echo -e "${RED}File $file not found. Skipping.${NC}"
    fi
done

echo -e "\n${GREEN}Database initialization completed successfully!${NC}"
echo -e "Connection string: ${YELLOW}postgresql://$DB_USER:******@$DB_HOST:$DB_PORT/$DB_NAME${NC}"

echo -e "\n${YELLOW}Database setup complete. You can now connect to your ShortCat Platform database.${NC}"

# Clean up

# Close SSH tunnel if active
if [ $SSH_TUNNEL_ACTIVE -eq 1 ]; then
    echo -e "${YELLOW}Closing SSH tunnel...${NC}"
    pkill -f "ssh -f -N -L $LOCAL_PORT:$DB_HOST_ORIG:$DB_PORT_ORIG"
    echo -e "${GREEN}SSH tunnel closed.${NC}"
    
    # Restore original connection details for display
    DB_HOST=$DB_HOST_ORIG
    DB_PORT=$DB_PORT_ORIG
fi

# Clean up temp directory if used
if [ "$SQL_LOCATION" == "2" ] && [ -d "$LOCAL_TEMP_DIR" ]; then
    echo -e "${YELLOW}Cleaning up temporary files...${NC}"
    rm -rf "$LOCAL_TEMP_DIR"
    echo -e "${GREEN}Temporary files removed.${NC}"
fi

echo -e "\n${BLUE}Connection Information:${NC}"
echo -e "Database name: ${YELLOW}$DB_NAME${NC}"
echo -e "Database host: ${YELLOW}$DB_HOST${NC}"
echo -e "Database port: ${YELLOW}$DB_PORT${NC}"
echo -e "Database user: ${YELLOW}$DB_USER${NC}"
