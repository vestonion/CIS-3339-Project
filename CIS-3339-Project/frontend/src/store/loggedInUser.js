
 // This pinia store contains state with respect to whether a user is logged in
import { defineStore } from 'pinia'
import { useToast } from 'vue-toastification'
import { loginUser, logoutUser, setAuthHeader } from '../api/api'
import jwt_decode from 'jwt-decode'

// Notifications
const toast = useToast()

// Defining a store
export const useLoggedInUserStore = defineStore({
  id: 'loggedInUser',

  state: () => {
    return {
      name: "",
      role: "",
      isLoggedIn: false
    }
  },

  actions: {
    async login(username, password) {
      try {
        const token = await loginUser(username, password)

        // Get the user's name and role from the JWT token
        const decodedToken = jwt_decode(token)

        this.$patch({
          isLoggedIn: true,
          role: decodedToken.role || '',
          name: decodedToken.name || ''
        })

        this.$router.push("/")
        toast.success("Login Sucessful!")

      } catch (error) {
        toast.error(error.message)
      }
    },

    logout() {
      logoutUser()

      // Reset value after user logs out
      this.clearSession()

      this.$router.push("/")
      toast.info("You have been logged out!")
    },

    clearSession() {
      this.name = ''
      this.role = ''
      this.isLoggedIn = false
    },

    restoreSession() {
      const token = localStorage.getItem('authToken')

      if (!token) {
        this.clearSession()
        return
      }

      try {
        const decoded = jwt_decode(token)

        // Check that the token has an expiration time in the future
        if (!decoded.exp || decoded.exp <= Date.now() / 1000) {
          throw new Error('Expired token')
        }

        setAuthHeader(token)

        this.name = decoded.name || ''
        this.role = decoded.role || ''
        this.isLoggedIn = true

      } catch {
        logoutUser()
        this.clearSession()
      }
    }
  }
})
