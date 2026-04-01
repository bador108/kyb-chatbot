# NMAP - Network Scanner

## Základní syntaxe
```
nmap [options] <target>
```

## Nejdůležitější přepínače

| Přepínač | Popis |
|----------|-------|
| `-sV` | Detekce verzí služeb |
| `-sC` | Výchozí skripty (ekvivalent --script=default) |
| `-A` | Agresivní scan (OS, verze, skripty, traceroute) |
| `-p-` | Všechny porty (1-65535) |
| `-p 80,443,8080` | Konkrétní porty |
| `-T4` | Rychlejší scan (T0=paranoid, T5=insane) |
| `-oN output.txt` | Uložit výstup (normal) |
| `-oA output` | Uložit ve všech formátech |
| `-sU` | UDP scan |
| `-sS` | SYN scan (stealth, vyžaduje root) |
| `-O` | Detekce OS |
| `--script vuln` | Scan na zranitelnosti |

## CTF Workflow

### 1. Rychlý initial scan
```bash
nmap -sV -sC -T4 <IP> -oN initial.txt
```

### 2. Full port scan
```bash
nmap -p- -T4 <IP> -oN allports.txt
```

### 3. Detailed scan nalezených portů
```bash
nmap -sV -sC -p 22,80,443,8080 <IP> -oN detailed.txt
```

### 4. Vulnerability scan
```bash
nmap --script vuln <IP>
nmap --script=http-vuln* <IP>
```

## Analýza výstupu

Typický výstup:
```
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.6p1
80/tcp open  http    Apache httpd 2.4.29
```

- **open** = port je otevřený, služba běží
- **closed** = port je dostupný, ale nic nenaslouchá
- **filtered** = firewall blokuje port

## Užitečné skripty

```bash
# HTTP enumeration
nmap --script http-enum <IP>

# SMB shares
nmap --script smb-enum-shares -p 445 <IP>

# FTP anonymous login
nmap --script ftp-anon -p 21 <IP>

# MySQL
nmap --script mysql-info -p 3306 <IP>
```

## Tipy pro CTF
- Vždy začni s `-sV -sC` na běžných portech
- Pak udělej full scan `-p-`
- Verze služeb jsou klíčové pro hledání CVE
- Zkontroluj HTTP tituly: `--script http-title`
