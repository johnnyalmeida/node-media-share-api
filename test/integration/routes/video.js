import StreamTest from 'streamtest';

describe('Route Video', () => {
  describe('My Stream Lib', () => {
    // Iterating through versions
    StreamTest.versions.forEach((version) => {
      describe(`for ${version} streams`, () => {
        // here goes your code
        it('should work', (done) => {
          const defaultText = '';

          StreamTest[version].fromChunks(['a ', 'chunk', 'and', 'another'])
            .pipe(defaultText)
            .pipe(StreamTest[version].toText((err, text) => {
              if (err) {
                done(err);
              }
              expect(text).to.be.eql(defaultText);
              // assert.equal(text, 'the text as i should be');
              done();
            }));
        });
      });
    });
  });

  describe('Route POST /video', () => {
    it('should upload a file', (done) => {
      request
        .post('/video')
        .field('test', 'myTest')
        .attach('files', './_files/sample_video.mp4', 'sample_video.mp4')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body[0].location).to.include('sample_video.mp4');
          done(err);
        });
    });
  });
});
