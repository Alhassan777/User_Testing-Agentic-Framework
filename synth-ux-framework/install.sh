#!/bin/bash

# Synth-UX MCP Server Installation Script
# This script installs the Synth-UX MCP server and configures Cursor to use it

set -e

echo "🧪 Installing Synth-UX MCP Server..."

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Install dependencies
echo "📦 Installing dependencies..."
cd "$SCRIPT_DIR"
npm install

# Install Playwright browsers
echo "🎭 Installing Playwright Chromium browser..."
npx playwright install chromium

# Build the TypeScript
echo "🔨 Building..."
npm run build

# Create the Cursor MCP config directory if it doesn't exist
CURSOR_MCP_DIR="$HOME/.cursor"
CURSOR_MCP_CONFIG="$CURSOR_MCP_DIR/mcp.json"

echo "⚙️  Configuring Cursor..."

# Check if mcp.json exists
if [ -f "$CURSOR_MCP_CONFIG" ]; then
    echo "Found existing mcp.json"
    
    # Check if synth-ux already exists in config
    if grep -q '"synth-ux"' "$CURSOR_MCP_CONFIG"; then
        echo "⚠️  synth-ux already configured in $CURSOR_MCP_CONFIG"
        echo "   To update, manually edit the file or remove the synth-ux entry first."
    else
        echo "Adding synth-ux to existing mcp.json..."
        # Use a temp file to add the new server
        # This is a simple approach - for complex JSON manipulation, consider using jq
        echo ""
        echo "📝 Please add this to your $CURSOR_MCP_CONFIG under 'mcpServers':"
        echo ""
        echo '    "synth-ux": {'
        echo '      "command": "node",'
        echo "      \"args\": [\"$SCRIPT_DIR/dist/index.js\"]"
        echo '    }'
        echo ""
    fi
else
    echo "Creating new mcp.json..."
    mkdir -p "$CURSOR_MCP_DIR"
    cat > "$CURSOR_MCP_CONFIG" << EOF
{
  "mcpServers": {
    "synth-ux": {
      "command": "node",
      "args": ["$SCRIPT_DIR/dist/index.js"]
    }
  }
}
EOF
    echo "✅ Created $CURSOR_MCP_CONFIG"
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Restart Cursor to load the MCP server"
echo "2. In any chat, type: 'Use synth_ux_full_test on https://your-app.com'"
echo ""
echo "📚 Available tools:"
echo ""
echo "   Agent Tools (AI-Powered):"
echo "   - synth_ux_full_test     Complete UX test"
echo "   - heuristic_evaluate     Nielsen's 10 + WCAG audit"
echo "   - persona_generate       Create diverse personas"
echo "   - session_simulate       Simulate a user session"
echo "   - list_agents            Show all agents"
echo ""
echo "   Video Recording (Playwright):"
echo "   - video_start_recording  Start recording a session"
echo "   - video_stop_recording   Stop and save video"
echo "   - video_list_recordings  List recorded videos"
echo ""
echo "   Accessibility (axe-core):"
echo "   - accessibility_scan     WCAG accessibility scan"
echo ""
echo "   Performance (Lighthouse):"
echo "   - lighthouse_audit       Core Web Vitals audit"
echo ""
