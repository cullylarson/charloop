# charloop

> An audio loop recorder for raspberry pi.

## App

### Dev

```
npm run watch
npm run client:start
npm run server:start
```

### Production

```
npm run build
```

## Raspberry Pi

1. Download the Lite version of Raspbian and copy to an SD card. You want the Lite version because it comes with a lot less crap and we can just install what we need instead.
1. Set up your raspberry pi.
1. Install these packages:

    ```
    apt-get install vim git
    ```

1. Install node (might need to change the wget URL here to a newer version):

    ```
    wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.33.4/install.sh | bash
    # you might need to re-login here to get nvm in your path
    nvm install stable
    # this installed version 8.5.0 for me
    ```

## References

- [Copy image to SD card (Mac)](https://www.raspberrypi.org/documentation/installation/installing-images/mac.md)
- [Enable headless SSH](https://hackernoon.com/raspberry-pi-headless-install-462ccabd75d0)
- [Set up Chromium kiosk mode on Raspbian Lite](https://tamarisk.it/raspberry-pi-kiosk-mode-using-raspbian-lite/)
- [Installing nvm on Raspberry Pi](https://github.com/creationix/nvm)
