#!/usr/bin/env python

import webapp2

class MainHandler(webapp2.RequestHandler):
    def get(self):
        self.response.write('I update automaticallyyy!')

app = webapp2.WSGIApplication([
    ('/', MainHandler)
], debug=True)
