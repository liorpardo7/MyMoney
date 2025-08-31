# 🚀 MyMoney Platform Startup Scripts

This directory contains comprehensive startup and management scripts for the MyMoney platform.

## 📁 Available Scripts

### 1. `start.sh` - Development Server Startup
**Purpose**: Starts the development server with full environment setup and validation

**Features**:
- ✅ Environment variable setup
- ✅ BigQuery connection verification
- ✅ Dependency installation check
- ✅ Port availability check
- ✅ Automatic server startup
- ✅ Health check verification
- ✅ Colored output and status messages

**Usage**:
```bash
./start.sh
```

**What it does**:
1. Checks project directory structure
2. Creates `.env.local` template if missing
3. Verifies BigQuery service account key
4. Installs dependencies if needed
5. Sets environment variables
6. Tests BigQuery connection
7. Starts development server on port 7777
8. Waits for server to be healthy
9. Shows server status and URLs

---

### 2. `start-prod.sh` - Production Server Startup
**Purpose**: Starts the production server with optimized settings

**Features**:
- ✅ Production build verification
- ✅ Environment validation
- ✅ Production server startup
- ✅ Health check verification
- ✅ Graceful shutdown handling

**Usage**:
```bash
./start-prod.sh
```

**What it does**:
1. Validates production configuration
2. Builds application if needed
3. Sets production environment variables
4. Starts production server on port 7777
5. Verifies server health
6. Shows production server status

---

### 3. `stop.sh` - Server Shutdown
**Purpose**: Gracefully stops all running MyMoney servers

**Features**:
- ✅ Stops development server
- ✅ Stops production server
- ✅ Frees port 7777
- ✅ Process cleanup verification

**Usage**:
```bash
./stop.sh
```

**What it does**:
1. Stops Next.js development server
2. Stops Next.js production server
3. Kills any processes on port 7777
4. Verifies port is free
5. Confirms successful shutdown

---

## 🛠️ Prerequisites

### Required Software
- **Node.js 18+**: JavaScript runtime
- **pnpm**: Package manager (install with `npm install -g pnpm`)
- **curl**: HTTP client (usually pre-installed on macOS/Linux)

### Required Files
- **`.env.local`**: Environment configuration
- **`mymoney-470619-2f22e813a9d7.json`**: BigQuery service account key
- **`package.json`**: Project configuration

---

## 🚀 Quick Start

### 1. First Time Setup
```bash
# Make scripts executable (if not already done)
chmod +x start.sh start-prod.sh stop.sh

# Start development server
./start.sh
```

### 2. Daily Development
```bash
# Start development server
./start.sh

# In another terminal, stop when done
./stop.sh
```

### 3. Production Deployment
```bash
# Start production server
./start-prod.sh

# Stop when needed
./stop.sh
```

---

## 🔧 Configuration

### Environment Variables
The scripts automatically set these environment variables:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/mymoney-470619-2f22e813a9d7.json"
export GOOGLE_CLOUD_PROJECT_ID="mymoney-470619"
export GOOGLE_CLOUD_DATASET="mymoney"
export GOOGLE_CLOUD_LOCATION="US"
export NODE_ENV="production"  # Only in production script
```

### Port Configuration
- **Default Port**: 7777
- **Change Port**: Modify the scripts or set `PORT` in `.env.local`

---

## 📊 Script Output

### Success Indicators
- 🎉 **Green success messages** for completed operations
- 📱 **Server URLs** displayed when running
- ✅ **Health check confirmation** for server status

### Warning Indicators
- ⚠️ **Yellow warning messages** for non-critical issues
- 🔧 **Configuration suggestions** for missing files
- 📝 **Setup instructions** for first-time users

### Error Indicators
- ❌ **Red error messages** for critical failures
- 🚫 **Exit codes** for script failures
- 📋 **Troubleshooting steps** for common issues

---

## 🚨 Troubleshooting

### Common Issues

#### 1. "Port 7777 is already in use"
```bash
# Solution: Stop existing servers
./stop.sh

# Then restart
./start.sh
```

#### 2. "BigQuery service account key not found"
```bash
# Solution: Place your service account key in project root
# File should be named: mymoney-470619-2f22e813a9d7.json
```

#### 3. "pnpm is not installed"
```bash
# Solution: Install pnpm globally
npm install -g pnpm
```

#### 4. "Server failed to start within 30 seconds"
```bash
# Solution: Check logs and restart
./stop.sh
./start.sh
```

### Debug Mode
To see detailed output, modify the scripts to remove `> /dev/null 2>&1` redirects.

---

## 🔄 Script Lifecycle

### Development Mode (`start.sh`)
```
1. Environment Setup → 2. Dependencies Check → 3. BigQuery Test → 4. Server Start → 5. Health Check → 6. Ready
```

### Production Mode (`start-prod.sh`)
```
1. Environment Validation → 2. Build Check → 3. Production Start → 4. Health Check → 5. Ready
```

### Shutdown (`stop.sh`)
```
1. Process Detection → 2. Graceful Stop → 3. Port Cleanup → 4. Verification → 5. Complete
```

---

## 📈 Performance Tips

### Development
- Use `./start.sh` for daily development
- Script automatically handles environment setup
- Fast startup with dependency caching

### Production
- Use `./start-prod.sh` for production deployment
- Script ensures proper build and optimization
- Production-grade error handling

### Monitoring
- Scripts provide real-time status updates
- Health checks ensure server availability
- Graceful shutdown prevents data loss

---

## 🔐 Security Features

- **Environment isolation**: Scripts don't expose sensitive data
- **Process management**: Proper cleanup on script exit
- **Port security**: Prevents port conflicts and unauthorized access
- **Service account validation**: Ensures BigQuery credentials are valid

---

## 📝 Customization

### Adding New Environment Variables
Edit the scripts and add new exports:
```bash
export NEW_VARIABLE="value"
```

### Changing Port
Modify the port references in all scripts:
```bash
# Change from 7777 to your desired port
PORT=3000
```

### Adding New Checks
Insert validation logic before server startup:
```bash
# Example: Check database connectivity
if ! checkDatabaseConnection; then
    print_error "Database connection failed"
    exit 1
fi
```

---

## 🎯 Best Practices

1. **Always use scripts**: Don't manually start servers
2. **Check output**: Monitor script messages for issues
3. **Use stop script**: Always stop servers before restarting
4. **Keep scripts updated**: Modify scripts when configuration changes
5. **Test in development**: Verify scripts work before production use

---

## 📞 Support

If you encounter issues with the startup scripts:

1. **Check prerequisites**: Ensure all required software is installed
2. **Verify configuration**: Confirm `.env.local` and service account key exist
3. **Review logs**: Check script output for error messages
4. **Restart cleanly**: Use `./stop.sh` then `./start.sh`
5. **Check documentation**: Review this README for troubleshooting steps

---

**These scripts provide a robust, automated way to start and manage your MyMoney platform, ensuring consistent deployment and easy troubleshooting.** 🚀
