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
    @{ Text = "Admin Django: http://localhost:8000/admin/"; Size = 10; Font = "F2" }
)

$Y = 760
$Content = "BT`n"
foreach ($Line in $Lines) {
    if ($Line.Text -eq "") {
        $Y -= 10
        continue
    }

    $X = if ($Line.Size -ge 14) { 54 } else { 72 }
    $Leading = if ($Line.Size -ge 14) { 22 } else { 16 }
    $Text = Escape-PdfText $Line.Text
    $Content += "/$($Line.Font) $($Line.Size) Tf`n"
    $Content += "$X $Y Td ($Text) Tj`n"
    $Content += "$(-$X) $(-$Y) Td`n"
    $Y -= $Leading
}
$Content += "ET`n"

$Objects = @(
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>",
    "<< /Length $([Text.Encoding]::ASCII.GetByteCount($Content)) >>`nstream`n$Content`nendstream"
)

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
