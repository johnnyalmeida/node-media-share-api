describe('Route Vide', () => {
  describe('Route GET /video', () => {
    it('should return status 200', (done) => {
      request
        .get('/video')
        .end((err, res) => {
          expect(res).to.have.status(200);
          done(err);
        });
    });
  });
});
