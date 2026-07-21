$files = git status --porcelain | ForEach-Object { $_.Substring(3).Trim() }

foreach ($file in $files) {
    if ($file -match '"') {
        $file = $file -replace '"',''
    }
    
    if (Test-Path $file) {
        git add $file
        $basename = Split-Path $file -Leaf
        if ($file -eq "server.js") {
            git commit -m "Feat(Server): Update JSON Server wrapper to integrate authRoutes"
        } else {
            git commit -m "Update $basename"
        }
    }
}
git push origin feature-tutor-test/datnt
