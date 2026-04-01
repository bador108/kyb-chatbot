# Gobuster - Web Directory & DNS Brute Forcer

## Instalace
```bash
sudo apt install gobuster
# nebo
go install github.com/OJ/gobuster/v3@latest
```

## Režimy
- `dir` - directory/file brute forcing
- `dns` - DNS subdomain brute forcing
- `vhost` - virtual host brute forcing
- `fuzz` - fuzzing

## Directory Brute Forcing

### Základní použití
```bash
gobuster dir -u http://<IP> -w /usr/share/wordlists/dirb/common.txt
```

### Doporučené příznaky

| Příznak | Popis |
|---------|-------|
| `-u` | URL cíle |
| `-w` | Wordlist |
| `-x` | Přípony souborů (php,html,txt) |
| `-t` | Počet vláken (default 10) |
| `-o` | Výstupní soubor |
| `-s` | Povolené stavové kódy (default: 200,204,301,302,307,401,403) |
| `--no-error` | Nezobrazovat chyby |
| `-k` | Ignorovat TLS certifikát |
| `-c` | Cookie hlavička |
| `-H` | Vlastní hlavička |

### CTF příkazy

```bash
# Základní scan s příponami
gobuster dir -u http://<IP> -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -x php,html,txt,bak -t 50

# S autentizací
gobuster dir -u http://<IP> -w wordlist.txt -U admin -P password

# S cookies (po přihlášení)
gobuster dir -u http://<IP> -w wordlist.txt -c "PHPSESSID=abc123; security=low"

# HTTPS s ignorováním certifikátu
gobuster dir -u https://<IP> -w wordlist.txt -k

# Hledat zálohy
gobuster dir -u http://<IP> -w wordlist.txt -x bak,old,backup,zip,tar.gz
```

## DNS Brute Forcing

```bash
# Subdomény
gobuster dns -d example.com -w /usr/share/wordlists/SecLists/Discovery/DNS/subdomains-top1million-5000.txt

# S vlastním DNS serverem
gobuster dns -d example.com -w wordlist.txt -r 8.8.8.8
```

## Virtual Host Fuzzing

```bash
gobuster vhost -u http://<IP> -w /usr/share/SecLists/Discovery/DNS/subdomains-top1million-5000.txt --append-domain
```

## Wordlisty (kali/parrot)

```
/usr/share/wordlists/dirb/common.txt          # rychlý
/usr/share/wordlists/dirb/big.txt             # střední
/usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt  # CTF oblíbený
/usr/share/seclists/Discovery/Web-Content/    # SecLists kolekce
```

## Alternativy
- **ffuf** - rychlejší, více možností
- **feroxbuster** - rekurzivní, v Rustu
- **dirsearch** - Python, jednoduchý

```bash
# ffuf ekvivalent
ffuf -u http://<IP>/FUZZ -w wordlist.txt -e .php,.html,.txt
```

## Interpretace výsledků
- **301/302** = přesměrování (zajímavé složky)
- **200** = existuje a je přístupné
- **403** = existuje, ale přístup zakázán (zkus bypass!)
- **401** = vyžaduje autentizaci
