describe('Route Video', () => {
  describe('Route POST /video', () => {
    it('should upload a file', (done) => {
      request
        .post('/api/uploads')
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
