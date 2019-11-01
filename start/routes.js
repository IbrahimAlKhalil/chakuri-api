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

Route.group(() => {
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

    Route.get('files/:id', 'FileController.show');


    /**************** Positions ******************/
    Route.resource('/positions', 'PositionController')
        .only(['store', 'destroy', 'update'])
        .middleware('auth');
    Route.get('/positions', 'PositionController.index');


    Route.post('/applications/shortlist/:id', 'ApplicationController.shortlist')
        .middleware('institute');
    Route.resource('/applications', 'ApplicationController')
        .only(['index', 'store'])
        .middleware('auth')
        .middleware('employee');

    Route.resource('/favorites', 'FavoriteController')
        .only(['index', 'store'])
        .middleware('auth')
        .middleware('employee');


    Route.get('show-resume', 'ResumeController.showResume')
        .middleware('auth')
        .middleware('institute');


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
});


/****************** Job ******************/

Route.group(() => {
    Route.resource('/jobs', 'JobController')
        .only(['store', 'destroy', 'update', 'index', 'show']);
    Route.get('/jobs/:id/applications', 'JobController.getApplications');
}).middleware('auth').middleware('institute');

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
}).middleware('auth');


Route.group(() => {
    Route.get('/job-requests', 'JobController.index').middleware('moderator:job-requests');
    Route.get('/job-requests/count', 'JobController.count').middleware('moderator:job-requests');
    Route.post('/job-requests', 'JobController.action').middleware('moderator:job-requests');

    Route.get('/moderators', 'ModeratorController.index').middleware('moderator:moderators');
    Route.get('/moderators/count', 'ModeratorController.count').middleware('moderator:moderators');
    Route.post('/moderators', 'ModeratorController.store').middleware('moderator:moderators');
    Route.delete('/moderators/:id', 'ModeratorController.destroy').middleware('moderator:moderators');

    Route.get('/roles', 'RoleController.index').middleware('moderator:moderators');
    Route.get('/roles/count', 'RoleController.count').middleware('moderator:moderators');
})
    .namespace('Dashboard')
    .prefix('dashboard')
    .middleware('auth');
