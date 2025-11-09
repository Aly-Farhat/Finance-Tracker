#!/bin/bash

# Cross-platform desktop app builder for Finance Tracker

set -e

echo ""
echo "============================================"
echo "   Finance Tracker Desktop App Builder"
echo "============================================"
echo ""

# Step 1: Build Frontend
echo "[1/5] Building frontend..."
cd frontend
npm run build
cd ..
echo "✅ Frontend built successfully!"
echo ""

# Step 2: Build Backend
echo "[2/5] Building backend..."
cd backend
npm run build
cd ..
echo "✅ Backend built successfully!"
echo ""

# Step 3: Prepare electron-app directory
echo "[3/5] Preparing Electron app..."
cd electron-app

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Electron dependencies..."
    npm install --save-dev electron electron-packager
fi

# Copy backend to electron-app
echo "📂 Copying backend files..."
rm -rf backend
mkdir -p backend

# Copy built backend
cp -r ../backend/dist backend/
cp ../backend/finance.db backend/ 2>/dev/null || true
cp ../backend/package.json backend/
cp -r ../backend/node_modules backend/

# Copy frontend dist
echo "📂 Copying frontend files..."
rm -rf frontend
cp -r ../frontend/dist frontend

echo "✅ Files prepared!"
echo ""

# Step 4: Detect platform
PLATFORM=$(uname -s)
case "$PLATFORM" in
    Darwin*)
        echo "[4/5] Packaging for macOS..."
        npx electron-packager . "Finance Tracker" \
            --platform=darwin \
            --arch=x64 \
            --out=dist \
            --overwrite \
            --no-prune \
            --ignore="(dist|\.git|\.vscode)"
        ;;
    Linux*)
        echo "[4/5] Packaging for Linux..."
        npx electron-packager . "Finance Tracker" \
            --platform=linux \
            --arch=x64 \
            --out=dist \
            --overwrite \
            --no-prune \
            --ignore="(dist|\.git|\.vscode)"
        ;;
    MINGW*|MSYS*|CYGWIN*)
        echo "[4/5] Packaging for Windows..."
        npx electron-packager . "Finance Tracker" \
            --platform=win32 \
            --arch=x64 \
            --out=dist \
            --overwrite \
            --no-prune \
            --ignore="(dist|\.git|\.vscode)"
        ;;
    *)
        echo "❌ Unsupported platform: $PLATFORM"
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    echo ""
    echo "============================================"
    echo "   SUCCESS! Your app is ready!"
    echo "============================================"
    echo ""
    echo "📦 Your app is located in: electron-app/dist/"
    echo ""
    cd ..
else
    echo ""
    echo "❌ Build failed!"
    cd ..
    exit 1
fi

echo "✨ Build complete!"

