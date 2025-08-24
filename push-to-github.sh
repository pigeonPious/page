#!/bin/bash

# Push to GitHub Script
# This script adds all changes, commits, and pushes to the remote repository
# Can be executed from file browser by double-clicking

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting GitHub push process...${NC}"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Not in a git repository${NC}"
    echo "Please run this script from within your git repository directory."
    read -p "Press Enter to exit..."
    exit 1
fi

# Check if there are any changes to commit
if git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}⚠️  No changes to commit${NC}"
    echo "All files are already up to date with the remote repository."
    read -p "Press Enter to exit..."
    exit 0
fi

# Get current timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Get current build number from projects.json or create one
if [ -f "projects.json" ]; then
    CURRENT_BUILD=$(grep -o '"build": [0-9]*' projects.json | grep -o '[0-9]*')
    if [ -z "$CURRENT_BUILD" ]; then
        CURRENT_BUILD=0
    fi
    NEW_BUILD=$((CURRENT_BUILD + 1))
    echo -e "${BLUE}📦 Current build: $CURRENT_BUILD → New build: $NEW_BUILD${NC}"
    
    # Update build number in projects.json
    sed -i '' "s/\"build\": $CURRENT_BUILD/\"build\": $NEW_BUILD/g" projects.json
    echo -e "${GREEN}✅ Build number updated to $NEW_BUILD${NC}"
else
    echo -e "${YELLOW}⚠️  projects.json not found, skipping build number update${NC}"
fi

# Add cache clearer to all HTML files
echo -e "${BLUE}🧹 Adding cache clearer to HTML files...${NC}"
find . -name "*.html" -type f | while read -r file; do
    if ! grep -q "cache-clearer" "$file"; then
        # Add cache clearer meta tag after existing meta tags
        sed -i '' '/<meta/a\
    <meta name="cache-clearer" content="'$NEW_BUILD'">' "$file"
        echo -e "${GREEN}✅ Added cache clearer to $file${NC}"
    else
        # Update existing cache clearer
        sed -i '' "s/<meta name=\"cache-clearer\" content=\"[^\"]*\"/<meta name=\"cache-clearer\" content=\"$NEW_BUILD\"/g" "$file"
        echo -e "${GREEN}✅ Updated cache clearer in $file${NC}"
    fi
done

# Add all changes
echo -e "${BLUE}📁 Adding all changes...${NC}"
git add .

# Commit changes
echo -e "${BLUE}💾 Committing changes...${NC}"
git commit -m "Update: $TIMESTAMP - Build $NEW_BUILD

- Automatic update from local changes
- Build number incremented to $NEW_BUILD
- Cache clearer added/updated
- Timestamp: $TIMESTAMP"

# Push to remote
echo -e "${BLUE}🚀 Pushing to remote repository...${NC}"
if git push origin main; then
    echo -e "${GREEN}✅ Successfully pushed to GitHub!${NC}"
    echo -e "${GREEN}📊 Build $NEW_BUILD deployed at $TIMESTAMP${NC}"
else
    echo -e "${RED}❌ Failed to push to GitHub${NC}"
    echo "Please check your remote configuration and try again."
    read -p "Press Enter to exit..."
    exit 1
fi

# Update build notes if they exist
if [ -f "BUILD_NOTES.md" ]; then
    echo -e "${BLUE}📝 Updating build notes...${NC}"
    echo "" >> BUILD_NOTES.md
    echo "## Build $NEW_BUILD - $TIMESTAMP" >> BUILD_NOTES.md
    echo "- Automatic update from local changes" >> BUILD_NOTES.md
    echo "- Cache clearer updated" >> BUILD_NOTES.md
    echo "- Deployed at: $TIMESTAMP" >> BUILD_NOTES.md
    echo "" >> BUILD_NOTES.md
    
    # Commit and push build notes
    git add BUILD_NOTES.md
    git commit -m "Update build notes for Build $NEW_BUILD"
    git push origin main
    echo -e "${GREEN}✅ Build notes updated and pushed${NC}"
fi

echo -e "${GREEN}🎉 All done! Your changes have been successfully pushed to GitHub.${NC}"
echo -e "${BLUE}📅 Build $NEW_BUILD completed at $TIMESTAMP${NC}"

# Keep terminal open so user can see the results
read -p "Press Enter to exit..."
