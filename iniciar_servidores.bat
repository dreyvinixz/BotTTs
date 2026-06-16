@echo off
echo Iniciando Servidor do Bot...
start "Servidor do Bot" cmd /k "npm start"

echo Iniciando Servidor de Imagem...
cd stable-diffusion-webui-forge
start "Stable Diffusion WebUI" cmd /k "webui-user.bat"
