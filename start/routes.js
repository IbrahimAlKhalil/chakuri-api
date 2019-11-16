'use strict';

// TODO: Re-organize api endpoints
// TODO: Review role/permissions security

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URLs and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route');

/************ Common *************/
Route.get('/time', 'CommonController.time');
Route.get('/institute-jobs-count', 'CommonController.institutionCount');
Route.get('/favorite-and-applied/:jobId', 'CommonController.favoriteAndApplied')
    .middleware('auth')
    .middleware('employee');


// Registration
Route.post('/register', 'UserController.register').middleware('guest');

/****************** Job filter ********************/

Route.post('/job-filter/filter', 'JobFilterController.filter');
Route.resource('/job-filter', 'JobFilterController').only(['index', 'show']);


/******************* Files *******************/

// Route.get('files/:id', 'FileController.show');


/**************** Positions ******************/
Route.resource('/positions', 'PositionController')
    .only(['store', 'destroy', 'update'])
    .middleware('auth');
Route.get('/positions', 'PositionController.index');

Route.resource('/applications', 'ApplicationController')
    .only(['index', 'store'])
    .middleware('auth')
    .middleware('employee');

Route.resource('/favorites', 'FavoriteController')
    .only(['index', 'store'])
    .middleware('auth')
    .middleware('employee');

Route.get('/setting/:name', 'CommonController.setting');
Route.get('/menu', 'CommonController.menu');


/******* Validation ********/
Route.post('/mobile-exists', 'UserController.userExists');


/******* Division/District/Thana *******/
Route.get('/districts/by-division/:divisionId', 'DistrictController.byDivision');
Route.get('/thanas/by-district/:districtId', 'ThanaController.byDistrict');
Route.get('/divisions', 'DivisionController.index');
Route.get('/districts', 'DistrictController.index');

Route.resource('/divisions', 'ThanaController').only(['store', 'destroy', 'update']).middleware('auth');
Route.resource('/districts', 'DistrictController').only(['store', 'destroy', 'update']).middleware('auth');
Route.resource('/thanas', 'ThanaController').only(['store', 'destroy', 'update']).middleware('auth');

Route.get('/email-verification/:token', 'VerificationController.email').as('email-verification');
Route.post('/forgot-password', 'UserController.forgotPassword').middleware('guest');
Route.post('/verify-password-token', 'VerificationController.password').middleware('guest');
Route.post('/reset-password', 'UserController.resetPassword').middleware('guest');
Route.get('/pages/:id', 'CommonController.show');
Route.get('/categories', 'CommonController.categories');

/***************** Resume ******************/
Route.group(() => {
    Route.resource('personal', 'PersonalController').only(['index', 'store']);

    Route.resource('address', 'AddressController').only(['index', 'store']);

    Route.resource('education', 'EducationController').only(['index', 'store', 'destroy', 'update']);
    Route.resource('training', 'TrainingController').only(['index', 'store', 'destroy', 'update']);
    Route.resource('experience', 'ExperienceController').only(['index', 'store', 'destroy', 'update']);
})
    .namespace('Resume')
    .middleware('auth')
    .middleware('employee')
    .prefix('/resume');

/**************** User profile ******************/
Route.group(() => {
    Route.post('update-email', 'UserController.updateEmail');
    Route.post('update-name', 'UserController.updateName');
    Route.post('update-mobile', 'UserController.updateMobile');
    Route.post('update-pass', 'UserController.updatePassword');
    Route.post('update-photo', 'UserController.updatePhoto');
    Route.post('update-description', 'UserController.updateDescription').middleware('institute');
    Route.post('update-address', 'UserController.updateAddress').middleware('institute');

    Route.get('category-and-type', 'UserController.getCategoryAndType').middleware('institute');
    Route.post('update-type', 'UserController.updateType').middleware('institute');
    Route.post('update-category', 'UserController.updateCategory').middleware('institute');

    Route.get('profile', 'UserController.profile');


    Route.get('mobile-verification/:token', 'VerificationController.mobile');
    Route.get('resend-mobile', 'VerificationController.resendMobile');
    Route.get('resend-email', 'VerificationController.resendEmail');
    Route.post('update-verification-payload', 'VerificationController.updatePayload');
    Route.get('/notifications', 'NotificationController.index');
    Route.get('/notifications/unread-count', 'NotificationController.unreadCount');
    Route.post('/notifications/:id', 'NotificationController.seen');
    Route.get('/activities/notificationClick', 'ActivityController.notificationClick');

    Route.resource('/jobs', 'JobController').middleware('institute');
    Route.resource('/job-applications', 'JobApplicationController')
        .only(['index', 'destroy', 'show', 'update'])
        .middleware('institute');
})
    .middleware('auth');


Route.group(() => {
    Route.get('/job-requests', 'JobController.index')
        .middleware('moderator:job-requests');
    Route.post('/job-requests', 'JobController.action')
        .middleware('moderator:job-requests');
    Route.resource('/roles', 'RoleController').middleware('moderator:roles');

    Route.get('/permissions', 'PermissionController.index').middleware('moderator:roles,moderators');
    Route.get('/roles-all', 'RoleController.all').middleware('moderator:roles,moderators');
    Route.get('/divisions-all', 'DivisionController.all').middleware('moderator:geolocation');
    Route.get('/districts-all', 'DistrictController.all').middleware('moderator:geolocation');

    Route.resource('/moderators', 'ModeratorController')
        .only(['index', 'store', 'update', 'destroy'])
        .middleware('moderator:moderators');

    Route.resource('/users', 'UserController')
        .middleware('moderator:users')
        .only(['index', 'destroy']);

    Route.resource('/positions', 'PositionController')
        .only(['index', 'store', 'update', 'destroy'])
        .middleware('moderator:positions');

    Route.resource('/institute-types', 'InstituteTypeController')
        .only(['index', 'store', 'update', 'destroy'])
        .middleware('moderator:institute-types');

    Route.resource('/categories', 'CategoryController')
        .only(['index', 'store', 'update', 'destroy'])
        .middleware('moderator:categories');

    Route.resource('/divisions', 'DivisionController')
        .middleware('moderator:geolocation');

    Route.resource('/districts', 'DistrictController')
        .middleware('moderator:geolocation');

    Route.resource('/thanas', 'ThanaController')
        .middleware('moderator:geolocation');

    Route.resource('/pages', 'PageController')
        .middleware('moderator:pages');

    Route.resource('/menus', 'MenuController')
        .middleware('moderator:menu');

    Route.resource('/menu-items', 'MenuItemController')
        .middleware('moderator:menu');

    Route.post('/menu-items/reorder', 'MenuItemController.reorder')
        .middleware('moderator:menu');

    Route.resource('/settings', 'SettingController')
        .middleware('moderator:settings');

    Route.resource('/menu-locations', 'MenuLocationController')
        .only(['index'])
        .middleware('moderator:menu');
})
    .namespace('Dashboard/Admin')
    .prefix('dashboard')
    .middleware('auth');
