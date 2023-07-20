import { messageToCredentials, AuthInfo, Credentials } from './auth';

describe('auth models', () => {
    it('messageToCredentials', () => {
        let msg : AuthInfo = {
            userDetails: {
                userId: "nist0",
                userLastName: "Anyone",
                userName: "Robyn"
            },
            token: "X",
            since: 1688045287.0,
            expires: 1688050000.0,
            foo: "bar"
        };

        let creds: Credentials = messageToCredentials(msg);

        expect(creds).toBeTruthy();
        expect(creds.userId).toEqual(msg.userDetails.userId);
        expect(creds.userAttributes['userId']).toBeFalsy();
        expect(creds.userAttributes).toEqual({userLastName: "Anyone", userName: "Robyn"});
        expect(creds.token).toEqual("X");
        expect(creds['foo']).toEqual("bar");
        expect(creds.since).toBeTruthy();
        expect(creds.since instanceof Date).toBeTruthy();
        expect(creds.expires).toBeTruthy();
        expect(creds.expires instanceof Date).toBeTruthy();
        expect((!!creds.since) && (!!creds.expires) && creds.since < creds.expires).toBeTruthy();

        delete msg['expires'];
        creds = messageToCredentials(msg);

        expect(creds).toBeTruthy();
        expect(creds.userId).toEqual(msg.userDetails.userId);
        expect(creds.userAttributes['userId']).toBeFalsy();
        expect(creds.userAttributes).toEqual({userLastName: "Anyone", userName: "Robyn"});
        expect(creds.token).toEqual("X");
        expect(creds['foo']).toEqual("bar");
        expect(creds.since).toBeTruthy();
        expect(creds.since instanceof Date).toBeTruthy();
        expect(creds.expires).toBeUndefined();
        
        delete msg['token'];
        delete msg['foo'];
        creds = messageToCredentials(msg);

        expect(creds).toBeTruthy();
        expect(creds.userId).toEqual(msg.userDetails.userId);
        expect(creds.userAttributes['userId']).toBeFalsy();
        expect(creds.userAttributes).toEqual({userLastName: "Anyone", userName: "Robyn"});
        expect(creds.token).toBeUndefined();
        expect(creds['foo']).toBeUndefined();
        expect(creds.since).toBeTruthy();
        expect(creds.since instanceof Date).toBeTruthy();
        expect(creds.expires).toBeUndefined();
        
    });

});
