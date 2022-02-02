# Nodejs CGI Daemon (nodecgid)


## Usage

This program will work as a webserver which listens 9345.

### Sample Configuration

#### /etc/nginx/sites-enabled/example.conf

```nginx
server {
    listen 80;
    server_name nas.ndlt6g.lan;
    root /srv/myNAS;
    location ~ /$ {
        proxy_set_header cgi_programid '/usr/bin/node /home/neruthes/DEV/coolaltindex/coolaltindex-nodecgid.js';
        proxy_set_header cgi_pseudohost 'coolaltindex-nodecgid.com';
        proxy_pass http://127.0.0.1:9345;
    }
}
```

#### /etc/nodecgid/config.json

```jsonc
{
    "port": 9345        // Specify a port; default is 9345
}
```

#### /etc/nodecgid/applets.list

This is a list of enabled applet daemons, identified by their `cgi_programid`.

```
/usr/bin/node /home/neruthes/DEV/coolaltindex/coolaltindex-nodecgid.js
```

#### /etc/nodecgid/applets.json

```jsonc
[
    { "pseudohost": "coolaltindex-nodecgid.com", "cmdline": "/usr/bin/node /home/neruthes/DEV/coolaltindex/coolaltindex-nodecgid.js" }
]
```


### How It Works

#### Startup

Upon startup, this program will read `/etc/nodecgid/sites.list` to get a list of enabled applet daemons.
It will start all the applet daemons (spawning child processes), with env `cgi_programid` and `cgi_programid_hash`.
An applet daemon shall be a webserver (listening on any arbitrary port); it informs this program its port,
by writing the port number to `/tmp/.nodecgid_port_${cgi_pseudohost}`.

Alternatiely, the applet port number may be specified in the Nginx server config by passing a `cgi_program_port` header.

#### Forwarding

This program will receive the `cgi_programid` header from Nginx.
This variable will be used to identify the expected applet, so that HTTP requests may be forwarded to the correct port.









## Copyright

Copyright (c) 2022 Neruthes.

Published with GNU GPLv2.