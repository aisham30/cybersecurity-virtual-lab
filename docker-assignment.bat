@echo off
REM ============================================================
REM  Assignment 9: Complete Docker Workflow Script
REM  VLab Cybersecurity Attack Simulation Platform
REM ============================================================
REM  INSTRUCTIONS:
REM  1. Open PowerShell/CMD as Administrator
REM  2. Make sure Docker Desktop is RUNNING (green icon in tray)
REM  3. Edit the USERNAME variable below with YOUR Docker Hub username
REM  4. Run this script: .\docker-assignment.bat
REM ============================================================

SET USERNAME=srushti
SET IMAGE_NAME=vlab-cybersecurity
SET FULL_IMAGE=%USERNAME%/%IMAGE_NAME%:latest

echo.
echo ============================================================
echo  STEP 1: Docker Installation Verification
echo ============================================================
echo.
docker --version
docker compose version
echo.
echo [SCREENSHOT 1] Take screenshot of the above output now!
echo.
pause

echo.
echo ============================================================
echo  STEP 2: Building Docker Image
echo ============================================================
echo.
cd /d "C:\Users\SRUSHTI\OneDrive\Desktop\Project\cybersecurity-virtual-lab"
echo Building image from Dockerfile...
echo.
docker build -t %IMAGE_NAME%:latest .
echo.
echo Listing the built image:
docker images | findstr %IMAGE_NAME%
echo.
echo [SCREENSHOT 2] Take screenshot of build output now!
echo [SCREENSHOT 3] Take screenshot of docker images listing now!
echo.
pause

echo.
echo ============================================================
echo  STEP 3: Login and Push to Docker Hub
echo ============================================================
echo.
echo Logging into Docker Hub...
docker login
echo.
echo Tagging image for Docker Hub...
docker tag %IMAGE_NAME%:latest %FULL_IMAGE%
echo.
echo Pushing image to Docker Hub...
docker push %FULL_IMAGE%
echo.
echo [SCREENSHOT 4] Take screenshot of push output now!
echo [SCREENSHOT 5] Open hub.docker.com in browser and screenshot your repo!
echo.
pause

echo.
echo ============================================================
echo  STEP 4: Pull Image from Docker Hub
echo ============================================================
echo.
echo Removing local image first (to demonstrate pull)...
docker rmi %FULL_IMAGE%
echo.
echo Pulling image from Docker Hub...
docker pull %FULL_IMAGE%
echo.
echo Verifying pulled image:
docker images | findstr %IMAGE_NAME%
echo.
echo [SCREENSHOT 6] Take screenshot of pull output now!
echo.
pause

echo.
echo ============================================================
echo  STEP 5: Run Application and Verify
echo ============================================================
echo.
echo Starting container...
docker run -d --name vlab-app -p 3000:3000 %FULL_IMAGE%
echo.
echo Container status:
docker ps | findstr vlab-app
echo.
echo Container logs:
docker logs vlab-app
echo.
echo [SCREENSHOT 7] Take screenshot of docker ps output now!
echo [SCREENSHOT 8] Take screenshot of docker logs output now!
echo.
echo ============================================================
echo  NOW OPEN BROWSER: http://localhost:3000
echo ============================================================
echo.
echo [SCREENSHOT 9] Take screenshot of the browser showing the app!
echo.
pause

echo.
echo ============================================================
echo  CLEANUP (After all screenshots are taken)
echo ============================================================
echo.
docker stop vlab-app
docker rm vlab-app
echo.
echo Done! Container stopped and removed.
echo All screenshots should be saved for your PDF submission.
echo.
pause
