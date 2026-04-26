#!/bin/bash
# Azure App Service startup script for Dspire VR Zone backend

echo "=== Dspire VR Zone API startup ==="
echo "DATABASE_URL: $DATABASE_URL"

# Ensure persistent storage directory exists
mkdir -p /home/data

cd /home/site/wwwroot

# Activate the Oryx-built virtual environment (created during SCM_DO_BUILD_DURING_DEPLOYMENT)
if [ -f /home/site/wwwroot/antenv/bin/activate ]; then
    echo "Activating antenv virtual environment..."
    source /home/site/wwwroot/antenv/bin/activate
else
    echo "antenv not found, using system Python"
fi

echo "Python: $(which python) $(python --version)"
echo "uvicorn: $(which uvicorn 2>/dev/null || echo 'not found')"

# Start the API server — SQLAlchemy creates tables on first request via create_all()
echo "Starting uvicorn on port 8000..."
exec python -m uvicorn main:app --host 0.0.0.0 --port 8000
