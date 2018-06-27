describe('Routes feed', () => {
  describe('Route GET /feed', () => {
    it('should return the feed', (done) => {
      request
        .get('/feed')
        .end((err, res) => {
          expect(res.body).to.be.an('array');
          expect(res).to.have.status(200);
          done(err);
        });
    });
  });
});
