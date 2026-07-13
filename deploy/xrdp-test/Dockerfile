# Dev-only throwaway RDP target for Phase 5 (in-browser desktop) verification.
# NOT for production. Deterministic creds so guacd can connect without guessing:
#   host: xrdp-test (compose service name)  port: 3389  user: student  pass: student
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
       xrdp xorgxrdp xfce4 xfce4-terminal dbus-x11 x11-xserver-utils \
  && adduser --disabled-password --gecos "" student \
  && echo "student:student" | chpasswd \
  && adduser student ssl-cert \
  && echo "xfce4-session" > /home/student/.xsession \
  && chown student:student /home/student/.xsession \
  && rm -rf /var/lib/apt/lists/*

EXPOSE 3389

# xrdp in a container has no init: start dbus, the session manager, then xrdp
# in the foreground so the container stays up.
CMD service dbus start \
  && /usr/sbin/xrdp-sesman \
  && exec /usr/sbin/xrdp --nodaemon
