import fs from 'fs';

describe('Routes history', () => {
  describe('Route POST history', () => {
    it('should upload a file', (done) => {
      const file = fs.readFileSync('./_files/sample_vertical.mp4');

      request
        .post('/history')
        .send({
          file: file.toString('base64'),
          type: 'video',
        })
        .end((err, res) => {
          console.log(res.body);
          expect(res.body).to.be.an('array');
          expect(res).to.have.status(200);
          done(err);
        });
    });
  });
});
