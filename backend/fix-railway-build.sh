#!/bin/bash

echo "🔧 Fixing Railway build issues..."

# Backup current requirements
if [ -f "requirements.txt" ]; then
    echo "📦 Backing up current requirements.txt..."
    cp requirements.txt requirements-backup.txt
fi

# Use minimal requirements
if [ -f "requirements-simple.txt" ]; then
    echo "📦 Switching to minimal requirements..."
    cp requirements-simple.txt requirements.txt
    echo "✅ Switched to minimal requirements"
else
    echo "❌ requirements-simple.txt not found"
    exit 1
fi

# Update railway.json if needed
if [ -f "railway.json" ]; then
    echo "⚙️ Railway configuration is ready"
else
    echo "❌ railway.json not found"
fi

echo "🚀 Ready to deploy to Railway!"
echo "💡 If build still fails, try the emergency fallback in RAILWAY_BUILD_FIXES.md" 