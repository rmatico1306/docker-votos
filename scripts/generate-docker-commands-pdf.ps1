$OutputPath = Join-Path (Get-Location) "comandos-docker.pdf"

function Escape-PdfText {
    param([string]$Text)
    return $Text.Replace("\", "\\").Replace("(", "\(").Replace(")", "\)")
}

$Lines = @(
    @{ Text = "Comandos principales de Docker"; Size = 20; Font = "F1" },
    @{ Text = "Guia rapida para este proyecto Django + React + PostgreSQL"; Size = 11; Font = "F1" },
    @{ Text = ""; Size = 10; Font = "F1" },
    @{ Text = "Levantar servicios"; Size = 14; Font = "F1" },
    @{ Text = "docker compose up"; Size = 10; Font = "F2" },
    @{ Text = "Inicia los servicios definidos en docker-compose.yml."; Size = 10; Font = "F1" },
    @{ Text = "docker compose up --build"; Size = 10; Font = "F2" },
    @{ Text = "Reconstruye las imagenes y luego inicia los contenedores."; Size = 10; Font = "F1" },
    @{ Text = "docker compose up -d"; Size = 10; Font = "F2" },
    @{ Text = "Inicia los servicios en segundo plano."; Size = 10; Font = "F1" },
    @{ Text = ""; Size = 10; Font = "F1" },
    @{ Text = "Detener y revisar"; Size = 14; Font = "F1" },
    @{ Text = "docker compose down"; Size = 10; Font = "F2" },
    @{ Text = "Detiene y elimina los contenedores del proyecto."; Size = 10; Font = "F1" },
    @{ Text = "docker compose ps"; Size = 10; Font = "F2" },
    @{ Text = "Muestra los contenedores y puertos activos."; Size = 10; Font = "F1" },
    @{ Text = "docker compose logs"; Size = 10; Font = "F2" },
    @{ Text = "Muestra logs de todos los servicios."; Size = 10; Font = "F1" },
    @{ Text = "docker compose logs web"; Size = 10; Font = "F2" },
    @{ Text = "Muestra logs del backend Django."; Size = 10; Font = "F1" },
    @{ Text = "docker compose logs frontend"; Size = 10; Font = "F2" },
    @{ Text = "Muestra logs del frontend React/Vite."; Size = 10; Font = "F1" },
    @{ Text = ""; Size = 10; Font = "F1" },
    @{ Text = "Entrar a contenedores y Django"; Size = 14; Font = "F1" },
    @{ Text = "docker compose exec web sh"; Size = 10; Font = "F2" },
    @{ Text = "Entra al contenedor de Django."; Size = 10; Font = "F1" },
    @{ Text = "docker compose exec web python manage.py migrate"; Size = 10; Font = "F2" },
    @{ Text = "Ejecuta migraciones de Django."; Size = 10; Font = "F1" },
    @{ Text = "docker compose exec web python manage.py createsuperuser"; Size = 10; Font = "F2" },
    @{ Text = "Crea el usuario administrador de Django."; Size = 10; Font = "F1" },
    @{ Text = ""; Size = 10; Font = "F1" },
    @{ Text = "Comandos Docker generales"; Size = 14; Font = "F1" },
    @{ Text = "docker ps"; Size = 10; Font = "F2" },
    @{ Text = "Lista contenedores corriendo."; Size = 10; Font = "F1" },
    @{ Text = "docker ps -a"; Size = 10; Font = "F2" },
    @{ Text = "Lista todos los contenedores, incluso detenidos."; Size = 10; Font = "F1" },
    @{ Text = "docker images"; Size = 10; Font = "F2" },
    @{ Text = "Lista imagenes Docker."; Size = 10; Font = "F1" },
    @{ Text = "docker stop NOMBRE_CONTENEDOR"; Size = 10; Font = "F2" },
    @{ Text = "Detiene un contenedor."; Size = 10; Font = "F1" },
    @{ Text = "docker rm NOMBRE_CONTENEDOR"; Size = 10; Font = "F2" },
    @{ Text = "Elimina un contenedor detenido."; Size = 10; Font = "F1" },
    @{ Text = "docker rmi NOMBRE_IMAGEN"; Size = 10; Font = "F2" },
    @{ Text = "Elimina una imagen."; Size = 10; Font = "F1" },
    @{ Text = ""; Size = 10; Font = "F1" },
    @{ Text = "Direcciones utiles"; Size = 14; Font = "F1" },
    @{ Text = "React/Vite: http://localhost:5173"; Size = 10; Font = "F2" },
    @{ Text = "Django: http://localhost:8000"; Size = 10; Font = "F2" },
    @{ Text = "Admin Django: http://localhost:8000/admin/"; Size = 10; Font = "F2" },
    @{ Text = ""; Size = 10; Font = "F1" },
    @{ Text = "Actualizar repositorio con Git"; Size = 14; Font = "F1" },
    @{ Text = "git status"; Size = 10; Font = "F2" },
    @{ Text = "Muestra el estado del repo, cambios pendientes y commits sin subir."; Size = 10; Font = "F1" },
    @{ Text = "git pull origin main"; Size = 10; Font = "F2" },
    @{ Text = "Descarga y aplica los cambios de la rama main en GitHub."; Size = 10; Font = "F1" },
    @{ Text = "git push origin main"; Size = 10; Font = "F2" },
    @{ Text = "Sube tus commits locales a GitHub."; Size = 10; Font = "F1" },
    @{ Text = "git fetch"; Size = 10; Font = "F2" },
    @{ Text = "Trae informacion del remoto sin mezclar cambios todavia."; Size = 10; Font = "F1" },
    @{ Text = "git branch -r"; Size = 10; Font = "F2" },
    @{ Text = "Lista las ramas remotas disponibles."; Size = 10; Font = "F1" },
    @{ Text = ""; Size = 10; Font = "F1" },
    @{ Text = "Flujo recomendado"; Size = 14; Font = "F1" },
    @{ Text = "git status"; Size = 10; Font = "F2" },
    @{ Text = "git add ."; Size = 10; Font = "F2" },
    @{ Text = "git commit -m `"guardar cambios locales`""; Size = 10; Font = "F2" },
    @{ Text = "git pull origin main"; Size = 10; Font = "F2" },
    @{ Text = "git push origin main"; Size = 10; Font = "F2" },
    @{ Text = ""; Size = 10; Font = "F1" },
    @{ Text = "AWS EC2 - conexion SSH"; Size = 14; Font = "F1" },
    @{ Text = "ssh -i .\mvp-prueba-key.pem ubuntu@18.222.10.25"; Size = 10; Font = "F2" },
    @{ Text = "Entra a la instancia Ubuntu EC2 usando la llave .pem."; Size = 10; Font = "F1" },
    @{ Text = "icacls .\mvp-prueba-key.pem /inheritance:r"; Size = 10; Font = "F2" },
    @{ Text = "Quita herencia de permisos en Windows para que SSH acepte la llave."; Size = 10; Font = "F1" },
    @{ Text = "icacls .\mvp-prueba-key.pem /grant `"$($env:USERNAME):R`""; Size = 10; Font = "F2" },
    @{ Text = "Da permiso de lectura solo a tu usuario de Windows."; Size = 10; Font = "F1" },
    @{ Text = ""; Size = 10; Font = "F1" },
    @{ Text = "AWS EC2 - instalar Docker"; Size = 14; Font = "F1" },
    @{ Text = "sudo apt update"; Size = 10; Font = "F2" },
    @{ Text = "Actualiza indices de paquetes en Ubuntu."; Size = 10; Font = "F1" },
    @{ Text = "sudo apt install -y ca-certificates curl git"; Size = 10; Font = "F2" },
    @{ Text = "Instala herramientas base para descargar Docker y clonar repos."; Size = 10; Font = "F1" },
    @{ Text = "sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin"; Size = 10; Font = "F2" },
    @{ Text = "Instala Docker Engine y el plugin de Docker Compose."; Size = 10; Font = "F1" },
    @{ Text = "sudo usermod -aG docker ubuntu"; Size = 10; Font = "F2" },
    @{ Text = "Permite usar Docker sin sudo. Despues sal y vuelve a entrar por SSH."; Size = 10; Font = "F1" },
    @{ Text = ""; Size = 10; Font = "F1" },
    @{ Text = "AWS EC2 - desplegar proyecto"; Size = 14; Font = "F1" },
    @{ Text = "git clone https://github.com/rmatico1306/docker-votos.git"; Size = 10; Font = "F2" },
    @{ Text = "Clona el repositorio en la EC2."; Size = 10; Font = "F1" },
    @{ Text = "cd docker-votos"; Size = 10; Font = "F2" },
    @{ Text = "Entra a la carpeta del proyecto."; Size = 10; Font = "F1" },
    @{ Text = "docker compose up -d --build"; Size = 10; Font = "F2" },
    @{ Text = "Construye y levanta la app en segundo plano."; Size = 10; Font = "F1" },
    @{ Text = "docker compose exec web python manage.py migrate"; Size = 10; Font = "F2" },
    @{ Text = "Aplica migraciones antes de crear usuario admin."; Size = 10; Font = "F1" },
    @{ Text = "docker compose exec web python manage.py createsuperuser"; Size = 10; Font = "F2" },
    @{ Text = "Crea usuario y contrasena para el admin de Django."; Size = 10; Font = "F1" },
    @{ Text = ""; Size = 10; Font = "F1" },
    @{ Text = "AWS EC2 - actualizar servidor"; Size = 14; Font = "F1" },
    @{ Text = "cd docker-votos"; Size = 10; Font = "F2" },
    @{ Text = "git pull origin main"; Size = 10; Font = "F2" },
    @{ Text = "docker compose up -d --build"; Size = 10; Font = "F2" },
    @{ Text = "docker compose exec web python manage.py migrate"; Size = 10; Font = "F2" },
    @{ Text = "Usa este flujo despues de subir cambios desde tu local a GitHub."; Size = 10; Font = "F1" },
    @{ Text = ""; Size = 10; Font = "F1" },
    @{ Text = "Variables .env usadas en EC2"; Size = 14; Font = "F1" },
    @{ Text = "nano .env"; Size = 10; Font = "F2" },
    @{ Text = "Abre el archivo de variables de entorno en la EC2."; Size = 10; Font = "F1" },
    @{ Text = "VITE_API_URL=http://18.222.10.25:8000/api"; Size = 10; Font = "F2" },
    @{ Text = "Hace que React llame al API de Django en la EC2."; Size = 10; Font = "F1" },
    @{ Text = "CORS_ALLOWED_ORIGINS=http://18.222.10.25:5173,http://localhost:5173,http://localhost:3000"; Size = 10; Font = "F2" },
    @{ Text = "Permite que Django acepte llamadas desde el frontend."; Size = 10; Font = "F1" },
    @{ Text = ""; Size = 10; Font = "F1" },
    @{ Text = "Direcciones en EC2"; Size = 14; Font = "F1" },
    @{ Text = "React/Vite: http://18.222.10.25:5173"; Size = 10; Font = "F2" },
    @{ Text = "Django admin: http://18.222.10.25:8000/admin/"; Size = 10; Font = "F2" },
    @{ Text = "Django API: http://18.222.10.25:8000/api"; Size = 10; Font = "F2" }
)

$Pages = New-Object System.Collections.Generic.List[string]
$Y = 760
$Content = "BT`n"
foreach ($Line in $Lines) {
    if ($Line.Text -eq "") {
        $Y -= 10
        continue
    }

    $X = if ($Line.Size -ge 14) { 54 } else { 72 }
    $Leading = if ($Line.Size -ge 14) { 22 } else { 16 }

    if (($Y - $Leading) -lt 54) {
        $Content += "ET`n"
        $Pages.Add($Content)
        $Y = 760
        $Content = "BT`n"
    }

    $Text = Escape-PdfText $Line.Text
    $Content += "/$($Line.Font) $($Line.Size) Tf`n"
    $Content += "$X $Y Td ($Text) Tj`n"
    $Content += "$(-$X) $(-$Y) Td`n"
    $Y -= $Leading
}
$Content += "ET`n"
$Pages.Add($Content)

$Objects = New-Object System.Collections.Generic.List[string]
$Objects.Add("<< /Type /Catalog /Pages 2 0 R >>")

$PageObjectStart = 5
$ContentObjectStart = $PageObjectStart + $Pages.Count
$Kids = New-Object System.Collections.Generic.List[string]
for ($Index = 0; $Index -lt $Pages.Count; $Index++) {
    $Kids.Add("$($PageObjectStart + $Index) 0 R")
}

$Objects.Add("<< /Type /Pages /Kids [$($Kids -join ' ')] /Count $($Pages.Count) >>")
$Objects.Add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
$Objects.Add("<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>")

for ($Index = 0; $Index -lt $Pages.Count; $Index++) {
    $ContentObjectId = $ContentObjectStart + $Index
    $Objects.Add("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents $ContentObjectId 0 R >>")
}

for ($Index = 0; $Index -lt $Pages.Count; $Index++) {
    $PageContent = $Pages[$Index]
    $Objects.Add("<< /Length $([Text.Encoding]::ASCII.GetByteCount($PageContent)) >>`nstream`n$PageContent`nendstream")
}

$Pdf = "%PDF-1.4`n"
$Offsets = New-Object System.Collections.Generic.List[int]
$Offsets.Add(0)

for ($Index = 0; $Index -lt $Objects.Count; $Index++) {
    $Offsets.Add([Text.Encoding]::ASCII.GetByteCount($Pdf))
    $Pdf += "$($Index + 1) 0 obj`n$($Objects[$Index])`nendobj`n"
}

$XrefOffset = [Text.Encoding]::ASCII.GetByteCount($Pdf)
$Pdf += "xref`n0 $($Objects.Count + 1)`n"
$Pdf += "0000000000 65535 f `n"
for ($Index = 1; $Index -lt $Offsets.Count; $Index++) {
    $Pdf += ("{0:D10} 00000 n `n" -f $Offsets[$Index])
}
$Pdf += "trailer`n<< /Size $($Objects.Count + 1) /Root 1 0 R >>`nstartxref`n$XrefOffset`n%%EOF`n"

[IO.File]::WriteAllBytes($OutputPath, [Text.Encoding]::ASCII.GetBytes($Pdf))
Get-Item $OutputPath | Select-Object FullName, Length
