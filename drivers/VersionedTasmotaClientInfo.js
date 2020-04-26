"use strict"

/* TasmotaClientInfo identifies the MAC address (and also hostname) of a tasmota device */

const {ClientInfo} = require('../drivers');

class VersionedTasmotaClientInfo extends ClientInfo {
  constructor(opts) {
    super(opts);
  }

  async parse(topic, payload) {
    switch (topic.toUpperCase()) {
      case "STATUS2":
        this._debug(`Got firmware information`);
        this.info.Version = payload.StatusFWR.Version.match(/([0-9\.]+)\(/)[1];
        this.gotVersion = true;
        break;
      case "STATUS5":
          if (!(payload && payload.StatusNET && payload.StatusNET.Hostname && payload.StatusNET.Mac))
              break;
          this._debug(`Got network information`);
          this.info.Hostname = payload.StatusNET.Hostname;
          this.info.Mac = payload.StatusNET.Mac.replace(/:/g,'');
          this.gotMac = true;
          break;
      }

    if (this.gotMac && this.gotVersion) {
      this.emit('ready', this.info);
    }
  }

  async query() {
    return [{topic:'STATUS', payload: Buffer.from('2')},{topic:'STATUS', payload: Buffer.from('5')}];
  }

  get DBKey() {return 'Mac';}
}

module.exports = VersionedTasmotaClientInfo;