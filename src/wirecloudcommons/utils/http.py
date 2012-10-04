# -*- coding: utf-8 -*-

# Copyright 2012 Universidad Politécnica de Madrid

# This file is part of Wirecloud.

# Wirecloud is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Wirecloud is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.

import socket
from urlparse import urljoin

from django.conf import settings
from django.contrib.sites.models import get_current_site
from django.core.urlresolvers import reverse
from django.http import HttpResponse

from commons.utils import get_json_error_response, get_xml_error
from wirecloudcommons.utils import mimeparser

ERROR_FORMATTERS = {
    'application/json; charset=utf-8': get_json_error_response,
    'application/xml; charset=utf-8': get_xml_error,
    'text/plain; charset=utf-8': unicode,
}


def build_error_response(request, status_code, error_msg):
    mimetype = mimeparser.best_match(ERROR_FORMATTERS.keys(), request.META['HTTP_ACCEPT'])
    return HttpResponse(ERROR_FORMATTERS[mimetype](error_msg), mimetype=mimetype, status=status_code)


def get_content_type(request):
    content_type_header = request.META.get('CONTENT_TYPE')
    if content_type_header is None:
        return '', ''
    else:
        return content_type_header.split(';', 1)


def get_current_domain(request=None):
    if hasattr(settings, 'FORCE_DOMAIN'):
        return settings.FORCE_DOMAIN
    else:
        try:
            return get_current_site(request).domain
        except:
            return socket.gethostbyaddr(socket.gethostname())[0] + ':' + str(getattr(settings, 'FORCE_PORT', 8000))


def get_current_scheme(request=None):
    if hasattr(settings, 'FORCE_PROTO'):
        return settings.FORCE_PROTO
    elif (request is not None) and request.is_secure():
        return 'https'
    else:
        return 'http'


def get_absolute_reverse_url(viewname, request=None, **kwargs):
    path = reverse(viewname, **kwargs)
    scheme = get_current_scheme(request)
    return urljoin(scheme + '://' + get_current_domain(request) + '/', path)


def get_absolute_static_url(url, request=None):
    scheme = get_current_scheme()
    base = urljoin(scheme + '://' + get_current_domain(request), settings.STATIC_URL)
    return urljoin(base, url)
