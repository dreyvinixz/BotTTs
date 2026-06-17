@echo off
cd /d "%~dp0.."

echo Iniciando Servidor do Bot...
start "Servidor do Bot" cmd /k "npm start"

echo Iniciando Servidor de Imagem...
start "Stable Diffusion WebUI" cmd /k "cd /d stable-diffusion-webui-forge && webui-user.bat"
