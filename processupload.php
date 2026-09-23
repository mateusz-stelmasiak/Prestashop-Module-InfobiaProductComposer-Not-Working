<?php
/*
 * Customer file upload for a "file" composer option.
 *
 * It needed no session, kept whatever extension the upload carried and
 * printed back the name it saved the file under. No template in this
 * version of the module posts to it any more, so it now refuses every
 * request instead of accepting files nobody asked for.
 */
header('HTTP/1.1 410 Gone');
header('Content-Type: text/plain; charset=utf-8');
exit;
