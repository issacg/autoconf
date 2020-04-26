/* eslint-disable max-lines-per-function */
/* eslint-disable no-unused-expressions */

"use strict"

const chai = require('chai'),
      lolex = require('lolex'),
      sinon = require('sinon'),
      sinonChai = require('sinon-chai'),
      lib = require('../../drivers/VersionedTasmotaClientInfo');

// eslint-disable-next-line no-unused-vars
const should = chai.should();
chai.use(sinonChai);

describe('VersionedTasmotaClientInfo', function() {
    let l = null;
    beforeEach(function() {
        l = new lib();
    });
    it('should always set DBKey to Mac', async function() {
        l.DBKey.should.equal('Mac');
    });
    it('should query topic STATUS with payloads 2 and 5', async function() {
        (await l.query()).should.deep.equal([{topic:'STATUS', payload: Buffer.from('2')}, {topic:'STATUS', payload: Buffer.from('5')}]);
    });
    it('should parse valid response', async function() {
        const status5Payload = {StatusNET: {
            Hostname: 'testclient',
            IPAddress: '10.0.23.231',
            Gateway: '10.0.23.1',
            Subnetmask: '255.255.255.0',
            DNSServer: '1.1.1.1',
            Mac: '11:22:33:44:55:66',
            Webserver: 1,
            WifiConfig: 1
        }};
        const status2Payload = {StatusFWR:{
            "Version":"7.2.0(tasmota)",
            "BuildDateTime":"2020-01-19T14:20:48",
            "Boot":31,
            "Core":"2_6_1",
            "SDK":"2.2.2-dev(38a443e)",
            "Hardware":"ESPFAKE",
            "CR":"277/1151"
        }};
        const expected = {
            Version: '7.2.0',
            Hostname: 'testclient', 
            Mac: '112233445566'
        };
        let spy1 = sinon.spy();
        let spy2 = sinon.spy();
        l.on('timeout', spy2);
        l.on('ready', (info) => {
            spy1();
            info.should.deep.equal(expected);
        });
        let clock = lolex.install();
        await l.parse('STATUS2', status2Payload);
        await l.parse('STATUS5', status5Payload);
        await clock.runToLastAsync();
        clock.uninstall();
        spy1.should.have.been.calledOnce;
        spy2.should.not.have.been.called;
    });
    it('should not parse invalid response', async function() {
        const statusPayload = {foo: 'bar'};
        let spy1 = sinon.spy();
        let spy2 = sinon.spy();
        let clock = lolex.install();
        l = new lib({timeout: 50});
        l.on('ready', spy1);
        l.on('timeout', spy2);
        await l.parse('STATUS5', statusPayload);
        await clock.tickAsync(50);
        clock.uninstall();
        spy1.should.not.have.been.called;
        spy2.should.have.been.calledOnce;
    });
});