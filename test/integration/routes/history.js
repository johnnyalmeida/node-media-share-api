import fs from 'fs';
import nock from 'nock';
import config from '../../../src/config/config';

describe('Routes history', () => {
  beforeEach(() => {
    console.log(config.video_processing_api_url);
    nock(config.video_processing_api_url)
      .post('/video', body => body.key)
      .reply(200, {
        ok: true,
      });
  });

  describe('Route POST a video history', () => {
    it('should upload a file', (done) => {
      const file = fs.readFileSync('./_files/sample_vertical.mp4');

      const mockedExternalApi = (type, key) => {
        if ((type === 'video' || type === 'image') && key && key !== '') {
          const fakeResult = { success: true };
          return fakeResult;
        }
        return false;
      };

      request
        .post('/history')
        .send({
          file: file.toString('base64'),
          type: 'video',
          testApi: mockedExternalApi,
        })
        .end((err, res) => {
          console.log(res.body);
          expect(res.body.data).to.contain.keys('id', 'key');
          expect(res).to.have.status(200);
          done(err);
        });
    });
  });
});
