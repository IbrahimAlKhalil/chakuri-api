'use strict'

const User = use('App/Models/User')
const {validate} = use('Validator')

class UserController {

    async register({request, response, auth}) {

        // Validate only password, name. Other inputs will be validated by userExists method
        const validation = await validate(request.only(['password', 'name']), {
            password: 'required|min:8',
            name: 'required'
        })


        // Validate password and name
        // mobile, user_type_id and email will be validated by userExists method
        if (validation.fails() || await this.userExists({request})) {
            return response.status(422).send('')
        }

        // Create user
        const user = await User.create(
            request.only(['user_type_id', 'mobile', 'email', 'password', 'name'])
        )

        // Attempt to login
        return await auth.login(
            user.mobile,
            request.input('password'),
            user.user_type_id,
            false,
            user.id
        )
    }

    async userExists({request, response}) {

        const validation = await validate(
            request.only(['user_type_id', 'mobile', 'email']), {
                user_type_id: 'required|in:1,2',
                mobile: 'required|mobile',
                email: 'email'
            })

        // If validation fails response with 422 status
        // If the status is 422 then the client must think that the data is invalid
        // If status is 200 then the client must look at the response
        if (validation.fails()) {
            // The register method also uses this method to
            // check user availability, and that is why the register
            // method doesn't validate user_type_id, mobile, email
            // so if validation fails then return true and register
            // method will response with status 422

            if (response) {
                return response.status(422).send('')
            }

            return true
        }

        const existsByMobile = await UserController.exists('mobile', request)

        // Check user's existence by email, though it's optional field in the registration form
        // exists method will check whether it's present in the request
        const existsByEmail = await UserController.exists('email', request)

        return existsByMobile || existsByEmail
    }

    async userExistsByEmail({request, response}) {
        const validation = await validate(
            request.only(['user_type_id', 'email']), {
                user_type_id: 'required|in:1,2',
                email: 'email'
            })

        if (validation.fails()) {

            if (response) {
                return response.status(422).send('')
            }

            return true
        }

        return await UserController.exists('email', request)
    }

    static async exists(column, request) {
        // If trying to check existence by email then it's presence is must
        // and email is an optional field in the registration form
        // if it's not here then user will be considered as not existed, and
        // when user will try to add his/her email in the dashboard, program will
        // check the email that time
        if (!request.input(column)) {
            return false
        }

        const count = await User.query()
            .where(column, request.input(column))
            .where('user_type_id', request.input('user_type_id'))
            .count('id as total')

        return !!count[0].total
    }
}

module.exports = UserController
