'use strict'

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
const Route = use('Route')

Route.post('/register', 'UserController.register').middleware('guest')

Route.group(() => {
    Route.resource('personal', 'PersonalController').only(['index', 'store'])

    Route.resource('address', 'AddressController').only(['index', 'store'])

    Route.resource('education', 'EducationController').only(['index', 'store', 'destroy', 'update'])
    Route.resource('training', 'TrainingController').only(['index', 'store', 'destroy', 'update'])
    Route.resource('experience', 'ExperienceController').only(['index', 'store', 'destroy', 'update'])
})
    .namespace('Resume')
    .middleware('auth')
    .middleware('employee')
    .prefix('/resume')


Route.group(() => {
    Route.post('update-email', 'UserController.updateEmail')
    Route.post('update-name', 'UserController.updateName')
    Route.post('update-mobile', 'UserController.updateMobile')
    Route.post('update-pass', 'UserController.updatePassword')
    Route.post('update-photo', 'UserController.updatePhoto')
    Route.post('update-description', 'UserController.updateDescription').middleware('institute')
    Route.post('update-address', 'UserController.updateAddress').middleware('institute')

    Route.get('mobile-verification/:token', 'UserController.verifyMobile').as('mobile-verification')

    Route.get('email-and-mobile', 'UserController.getEmailAndMobile')
}).middleware('auth')


/******* Validation ********/
Route.post('/mobile-exists', 'UserController.userExists')
Route.post('/email-exists', 'UserController.userExistsByEmail')


/******* Division/District/Thana *******/
Route.resource('/districts', 'DistrictController')
Route.get('/districts/by-division/:divisionId', 'DistrictController.byDivision')

Route.resource('/thanas', 'ThanaController')
Route.get('/thanas/by-district/:districtId', 'ThanaController.byDistrict')


/**************** Verification *******************/

Route.get('email-verification/:token', 'UserController.verifyEmail').as('email-verification')
