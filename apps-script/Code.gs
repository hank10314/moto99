function doGet(e) {
  try {
    var params = (e && e.parameter) || {};
    var action = params.action || 'dashboard';
    ensureDatabaseInitialized();
    return jsonResponse(success(routeGet(action, params)));
  } catch (err) {
    return jsonResponse(failure('REQUEST_ERROR', err.message || String(err)));
  }
}

function doPost(e) {
  try {
    var params = (e && e.parameter) || {};
    var payload = parsePostBody(e);
    var action = params.action || payload.action;
    if (!action) throw new Error('action is required');
    ensureDatabaseInitialized();
    return jsonResponse(success(routePost(action, payload)));
  } catch (err) {
    return jsonResponse(failure('REQUEST_ERROR', err.message || String(err)));
  }
}
